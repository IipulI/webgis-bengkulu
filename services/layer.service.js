import models from '../models/index.js'
import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { sequelize } from "../config/database.js";
import { Op } from 'sequelize'

const { Layer, SpatialPoint, SpatialLine, SpatialPolygon } = models;

export const getLayer = async () => {
    try {
        return await Layer.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'geometryType', 'color', 'metadata'],
            order: [['name', 'ASC']]
        });
    } catch (error) {
        console.error("Error fetching layers:", error);
        return error
    }
}

export const getLayerDetailDashboard = async (id) => {
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

    try {
        return await Layer.findByPk(id, {
            include: {
                model: TargetModel,
                as: alias
            }
        })
    }
    catch (error) {
        console.error("Error fetching layer:", error);
        return error
    }
}

export const getLayerDetail = async (id) => {
    const layer = await Layer.findByPk(id);
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    let TargetModel;
    if (layer.geometryType === 'POINT') {
        TargetModel = SpatialPoint;
    }
    else if (layer.geometryType === 'LINE') {
        TargetModel = SpatialLine;
    }
    else if (layer.geometryType === 'POLYGON') {
        TargetModel = SpatialPolygon;
    }
    else {
        throw new BadRequestError("Tipe geometri layer tidak valid")
    }

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
                    'id', id,
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', properties
                ) AS feature
                FROM ${TargetModel.tableName}
                WHERE layer_id = :layerId
                AND deleted_at IS NULL
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

        return geojsonData

    } catch (error) {
        console.error("Error generating GeoJSON:", error);
        return error;
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