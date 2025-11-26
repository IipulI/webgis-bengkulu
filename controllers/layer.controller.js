import db from "../models/index.js";

const { Layer, SpatialPoint, SpatialLine, SpatialPolygon, sequelize } = db;

export const getLayers = async (req, res) => {
    try {
        const layers = await Layer.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'geometryType', 'color', 'metadata'], // Hemat bandwidth
            order: [['name', 'ASC']]
        });

        return res.json({
            success: true,
            data: layers
        });
    } catch (error) {
        console.error("Error fetching layers:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getLayerGeoJSON = async (req, res) => {
    const { id } = req.params;

    try {
        const layer = await Layer.findByPk(id);
        if (!layer) {
            return res.status(404).json({ success: false, message: "Layer tidak ditemukan" });
        }

        let TargetModel;
        if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
        else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
        else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;
        else return res.status(400).json({ success: false, message: "Tipe geometri layer tidak valid" });

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

        return res.json(geojsonData);

    } catch (error) {
        console.error("Error generating GeoJSON:", error);
        return res.status(500).json({ success: false, message: "Gagal memuat data spasial" });
    }
};