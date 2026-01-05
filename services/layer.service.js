import models from '../models/index.js'
import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { sequelize } from "../config/database.js";
import { Op } from 'sequelize'
import { getPagination } from "../utils/pagination.js";

const { FeatureAttachment, Layer, LayerSchema, SpatialPoint, SpatialLine, SpatialPolygon } = models;

export const getLayer = async () => {
    try {
        return await Layer.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'description', 'category', 'subCategory', 'geometryType', 'color', 'metadata'],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error("Error fetching layers:", error);
        return error
    }
}

export const getLayerDetailDashboard = async (id, page, size) => {
    const isPaginated = page != null && size != null;
    const { limit, offset } = getPagination(page, size);

    const layer = await Layer.findByPk(id);
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan");
    }

    let TargetModel;
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;
    else throw new BadRequestError("Tipe geometri layer tidak valid");

    try {
        const itemQuery = {
            where: { layerId: id },
            include: [{
                model: FeatureAttachment,
                as: "attachments",
                required: false,
            }],
            limit: isPaginated ? limit : undefined,
            offset: isPaginated ? offset : undefined,
            order: [['createdAt', 'DESC']]
        };

        const { count, rows: itemRows } = await TargetModel.findAndCountAll(itemQuery);

        const layerData = layer.toJSON();
        layerData.spatialItem = itemRows;

        return {
            count: count,
            rows: [layerData],
            isPaginated: isPaginated
        };

    } catch (error) {
        console.error("Error fetching layer details:", error);
        throw error;
    }
}

export const getLayerDetail = async (id, isPublicUser = false) => {
    const layer = await Layer.findByPk(id);
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan");
    }

    const schema = await LayerSchema.findOne({
        where: { subCategory: layer.subCategory }
    });

    let visibleSchema = [];
    if (schema && schema.definition) {
        visibleSchema = schema.definition.filter(rule => {
            // Jika user Public DAN atribut ini diset private -> HIDE
            if (isPublicUser && rule.is_visible_public === false) {
                return false;
            }
            return true;
        });
    }

    let TargetModel;
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;
    else throw new BadRequestError("Tipe geometri layer tidak valid");

    try {
        const query = `
            SELECT 
                s.id,
                s.name,
                -- Ambil Kolom Fisik (Hardcoded Columns)
                s.year_built,
                s.reg_number,
                s.asset_code,
                s.condition,
                s.managed_by,
                
                -- Ambil JSONB Properties (Kita rename jadi json_props biar jelas)
                s.properties as json_props,
                
                -- Ambil Geometri sebagai JSON
                ST_AsGeoJSON(s.geom)::json as geometry,

                -- Subquery untuk Attachments (Tetap di SQL biar performa tinggi)
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', fa.id,
                            'file_url', fa.file_url,
                            'original_name', fa.original_name,
                            'file_type', fa.file_type,
                            'description', fa.description
                        )
                    ), '[]'::json)
                    FROM feature_attachments fa
                    WHERE fa.feature_id = s.id
                    AND fa.deleted_at IS NULL
                ) as attachments

            FROM ${TargetModel.tableName} s
            WHERE s.layer_id = :layerId
              AND s.deleted_at IS NULL
        `;

        const rawFeatures = await sequelize.query(query, {
            replacements: { layerId: id },
            type: sequelize.QueryTypes.SELECT
        });

        const processedFeatures = rawFeatures.map(row => {
            const finalProperties = {};

            if (schema && schema.definition) {
                schema.definition.forEach(rule => {
                    if (isPublicUser && rule.is_visible_public === false) {
                        return;
                    }

                    // Ambil Datanya (Cari di Kolom Fisik dulu, baru di JSONB)
                    let value = null;

                    // 1. Cek di kolom fisik tabel (row.year_built, row.condition, dll)
                    if (row[rule.key] !== undefined) {
                        value = row[rule.key];
                    }
                    // 2. Cek di dalam JSONB (row.json_props.luas, dll)
                    else if (row.json_props && row.json_props[rule.key] !== undefined) {
                        value = row.json_props[rule.key];
                    }

                    finalProperties[rule.key] = value;
                });
            }
            else {
                finalProperties.year_built = row.year_built;
                finalProperties.reg_number = row.reg_number;
                finalProperties.asset_code = row.asset_code;
                finalProperties.condition = row.condition;
                finalProperties.managed_by = row.managed_by;
                Object.assign(finalProperties, row.json_props);
            }

            return {
                type: "Feature",
                id: row.id,
                name: row.name,
                geometry: row.geometry,
                properties: finalProperties,
                attachments: row.attachments
            };
        });

        const geoJsonResult = {
            type: "FeatureCollection",
            name: layer.name,
            features: processedFeatures,
            schema: visibleSchema
        };

        if (layer.metadata && layer.metadata.crs) {
            geoJsonResult.crs = layer.metadata.crs;
        }

        return geoJsonResult;

    } catch (error) {
        console.error("Error generating GeoJSON:", error);
        throw error;
    }
};

export const createNewLayer = async(layerData) => {
    const existingLayer = await Layer.findOne({
        where: {
            name: { [Op.iLike]: layerData.name },
        }
    })
    if (existingLayer) {
        throw new ConflictError(`Layer dengan nama ${layerData.name} sudah ada, tolong gunakan nama lain`)
    }

    try {
        return await Layer.create({
            name: layerData.name,
            description: layerData.description,
            geometryType: layerData.geometryType,
            color: layerData.color,
            iconUrl: layerData.iconUrl,
            metadata: layerData.metadata,
        })
    }
    catch (error) {
        console.error(error)
        throw error;
    }
}

export const updateLayer = async (layerId, layerData) => {
    const existingLayer = await Layer.findByPk(layerId)
    if (!existingLayer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    try {
        return await existingLayer.update({
            name: layerData.name,
            description: layerData.description,
            geometryType: layerData.geometryType,
            color: layerData.color,
            iconUrl: layerData.iconUrl,
            metadata: layerData.metadata,
        })
    }
    catch (error) {
        console.error(error)
        throw error;
    }
}

export const deleteLayer = async (layerId) => {
    const layer = await Layer.findByPk(layerId, {
        attributes: ['id']
    })
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    await layer.destroy()
}

export const toggleLayer = async (layerId) => {
    const layer = await Layer.findByPk(layerId)
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    try {
        if (layer.isActive === true) {
            return await layer.update({isActive: false})
        }
        else if (layer.isActive === false) {
            return await layer.update({isActive: true})
        }
        else {
            new InternalServerError()
        }
    }
    catch (error) {
        console.error(error)
        throw error;
    }
}