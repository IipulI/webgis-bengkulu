import models from '../models/index.js'
import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { sequelize } from "../config/database.js";
import { Op } from 'sequelize'
import { getPagination } from "../utils/pagination.js";

const { FeatureAttachment, Layer, SpatialPoint, SpatialLine, SpatialPolygon } = models;

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

    const layer = await Layer.findByPk(id, {
        attributes: ['id', 'geometryType'],
    });
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    let TargetModel;
    let alias;
    if (layer.geometryType === 'POINT') {
        TargetModel = SpatialPoint;
        alias = "spatialPoint";
    }
    else if (layer.geometryType === 'LINE') {
        TargetModel = SpatialLine;
        alias = "spatialLine";
    }
    else if (layer.geometryType === 'POLYGON') {
        TargetModel = SpatialPolygon;
        alias = "spatialPolygon";
    }
    else {
        throw new BadRequestError("Tipe geometri layer tidak valid")
    }

    let queryBuilder = {
        include: {
            model: TargetModel,
            as: alias,
            include: {
                model: FeatureAttachment,
                as: "attachments",
                required: false,
            }
        }
    }

    try {
        if (isPaginated) {
            const { limit, offset } = getPagination(page, size);
            queryBuilder.limit = limit;
            queryBuilder.offset = offset;
        }

        const { count, rows } =  await Layer.findByPk(id, queryBuilder)

        const plainData = rows.toJSON();

        if (plainData[alias]) {
            plainData.spatialItem = plainData[alias];
            delete plainData[alias];
        } else {
            plainData.spatialItem = [];
        }

        return {
            count: count,
            rows: plainData,
            isPaginated: isPaginated
        }
    }
    catch (error) {
        console.error("Error fetching layer:", error);
        return error
    }
}

export const getLayerDetail = async (id) => {
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
        const query = `
            SELECT json_build_object(
                           'type', 'FeatureCollection',
                           'name', :layerName,
                           'features', COALESCE(json_agg(features.feature), '[]')
                   ) AS geojson
            FROM (
                     SELECT json_build_object(
                                    'type', 'Feature',
                                    'id', s.id,
                                    'name', s.name,
                                    'year_built', s.year_built,
                                    'reg_number', s.reg_number,
                                    'asset_code', s.asset_code,
                                    'condition', s.condition,
                                    'managed_by', s.managed_by,
                                    'geometry', ST_AsGeoJSON(s.geom)::json,
                                    'properties', s.properties,

                                    'attachments', (
                                        SELECT COALESCE(json_agg(
                                                                json_build_object(
                                                                        'id', fa.id,
                                                                        'file_url', fa.file_url,
                                                                        'original_name', fa.original_name, -- Sertakan nama asli
                                                                        'file_type', fa.file_type,
                                                                        'description', fa.description
                                                                )
                                                        ), '[]'::json)
                                        FROM feature_attachments fa
                                        WHERE fa.feature_id = s.id
                                        -- AND fa.deleted_at IS NULL -- (Aktifkan jika pakai soft delete di attachment)
                                    )

                            ) AS feature
                     FROM ${TargetModel.tableName} s
                     WHERE s.layer_id = :layerId
                       AND s.deleted_at IS NULL
                 ) features;
        `;

        const result = await sequelize.query(query, {
            replacements: { layerId: id, layerName: layer.name },
            type: sequelize.QueryTypes.SELECT
        });

        const geojsonData = result[0].geojson;

        if (layer.metadata && layer.metadata.crs) {
            geojsonData.crs = layer.metadata.crs;
        }

        return geojsonData;

    } catch (error) {
        console.error("Error generating GeoJSON:", error);
        throw error;
    }
}

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
            throw new InternalServerError()
        }
    }
    catch (error) {
        console.error(error)
        throw error;
    }
}