import models from '../models/index.js'
import { BadRequestError, NotFoundError } from "../utils/custom-error.js";
import { sequelize } from "../config/database.js";

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
        return new Error(error.message);
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