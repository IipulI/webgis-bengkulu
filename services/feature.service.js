import models from '../models/index.js'
import { sequelize } from "../config/database.js";
import { NotFoundError, UnprocessableEntityError } from "../utils/custom-error.js";


const { FeatureAttachment, Layer, SpatialLine, SpatialPoint, SpatialPolygon } = models

// export const getAllSpatialFeatureByLayer = async (layerId) => {
//     const layer = await Layer.findByPk(layerId);
//     if (!layer) {
//         throw new NotFoundError("Layer tidak ditemukan")
//     }
//
//     let spatial
//     switch(layer.geometryType) {
//         case 'POINT':
//             spatial = SpatialPoint;
//             break;
//         case 'LINE':
//             spatial = SpatialLine;
//             break;
//         case 'POLYGON':
//             spatial = SpatialPolygon;
//             break;
//         default :
//             throw new UnprocessableEntityError('Terjadi kesalahan pada tipe layer');
//     }
//
//      try {
//         const query = `
//             SELECT
//                 layers.*,
//                 features.*
//             FROM layers
//                 LEFT OUTER JOIN ${spatial.tableName} as features ON layers.id = features.layer_id
//             WHERE layers.id = :layerId
//                 AND layers.deleted_at IS NULL
//                 AND features.deleted_at IS NULL
//         `
//
//          const result = await sequelize.query(query, {
//              replacements: { layerId: layerId },
//              type: sequelize.QueryTypes.SELECT,
//          })
//
//          return result
//      } catch (error) {
//         console.error(error);
//         throw new Error(error.message);
//      }
// }

export const getOneSpatialFeature = async (layerId, featureId) => {
    const layer = await Layer.findByPk(layerId);
    if (!layer) throw new NotFoundError("Layer tidak ditemukan");

    let TargetModel;
    switch(layer.geometryType) {
        case 'POINT': TargetModel = SpatialPoint; break;
        case 'LINE': TargetModel = SpatialLine; break;
        case 'POLYGON': TargetModel = SpatialPolygon; break;
        default: throw new UnprocessableEntityError('Tipe layer error');
    }

    const feature = await TargetModel.findOne({
        where: { id: featureId, layerId: layerId },
        include: [
            {
                model: FeatureAttachment,
                as: 'attachments',
                attributes: ['id', 'fileUrl', 'fileType', 'description']
            }
        ]
    });

    if (!feature) throw new NotFoundError("Data spasial tidak ditemukan");

    return feature;
};

export const addSpatialFeatures = async (layerId, spatialData) => {
    const layer = await Layer.findByPk(layerId);
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan");
    }

    let TargetModel;
    let needMulti = false;
    switch (layer.geometryType) {
        case 'POINT':
            TargetModel = SpatialPoint;
            needMulti = false;
            break;
        case 'LINE':
            TargetModel = SpatialLine;
            needMulti = true;
            break;
        case 'POLYGON':
            TargetModel = SpatialPolygon;
            needMulti = true;
            break;
        default:
            throw new UnprocessableEntityError(`Tipe layer tidak dikenali: ${layer.geometryType}`);
    }

    try {
        const geojsonString = typeof spatialData.geom === 'object'
            ? JSON.stringify(spatialData.geom)
            : spatialData.geom;

        let geomLogic = sequelize.fn('ST_GeomFromGeoJSON', geojsonString);

        if (needMulti) {
            geomLogic = sequelize.fn('ST_Multi', geomLogic);
        }

        geomLogic = sequelize.fn('ST_SetSRID', geomLogic, 4326);
        geomLogic = sequelize.fn('ST_Force3D', geomLogic);

        return await TargetModel.create({
            layerId: layerId,
            name: spatialData.name || 'Tanpa Nama',
            properties: spatialData.properties || {},
            geom: geomLogic,
            // createdBy: spatialData.userId
        });

    } catch (error) {
        console.error("Error adding spatial feature:", error);
        throw error;
    }
};

export const updateSpatialFeatures = async(layerId, featureId, spatialData) => {
    const layer = await Layer.findByPk(layerId);
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan");
    }

    let TargetModel;
    let needMulti = false;

    switch(layer.geometryType) {
        case 'POINT':
            TargetModel = SpatialPoint;
            needMulti = false;
            break;
        case 'LINE':
            TargetModel = SpatialLine;
            needMulti = true;
            break;
        case 'POLYGON':
            TargetModel = SpatialPolygon;
            needMulti = true;
            break;
        default :
            throw new UnprocessableEntityError('Terjadi kesalahan pada tipe layer');
    }

    const feature = await TargetModel.findOne({
        where: { id: featureId, layerId: layerId }
    });

    if (!feature) {
        throw new NotFoundError("Data spasial tidak ditemukan di layer ini");
    }

    try {
        const updatePayload = {};

        if (spatialData.name !== undefined) {
            updatePayload.name = spatialData.name;
        }

        if (spatialData.properties !== undefined) {
            updatePayload.properties = spatialData.properties;
        }

        if (spatialData.geom) {
            const geojsonString = typeof spatialData.geom === 'object'
                ? JSON.stringify(spatialData.geom)
                : spatialData.geom;

            // RAKIT QUERY POSTGIS (Sama seperti Create)
            let geomLogic = sequelize.fn('ST_GeomFromGeoJSON', geojsonString);

            if (needMulti) {
                geomLogic = sequelize.fn('ST_Multi', geomLogic);
            }

            geomLogic = sequelize.fn('ST_SetSRID', geomLogic, 4326);
            geomLogic = sequelize.fn('ST_Force3D', geomLogic); // Paksa 3D agar update berhasil

            updatePayload.geom = geomLogic;
        }

        // 1. Eksekusi Update (Kirim perintah ke DB)
        await feature.update(updatePayload);

        // 2. [PENTING] RELOAD DATA DARI DB
        // Kita harus ambil ulang agar dapat koordinat hasil perhitungan PostGIS,
        // BUKAN object fungsi 'ST_Force3D' tadi.
        await feature.reload({
            attributes: {
                include: [
                    // Kita minta PostGIS formatkan geom jadi GeoJSON string lagi
                    [sequelize.fn('ST_AsGeoJSON', sequelize.col('geom')), 'geom']
                ]
            }
        });

        // 3. Konversi Instance ke JSON Object Biasa
        const responseData = feature.toJSON();

        // 4. Parsing String GeoJSON menjadi Object Javascript
        // Karena ST_AsGeoJSON mengembalikan string "{\"type\": ...}"
        if (responseData.geom && typeof responseData.geom === 'string') {
            responseData.geom = JSON.parse(responseData.geom);

            // Tambahkan CRS agar standar
            responseData.geom.crs = {
                type: "name",
                properties: { name: "EPSG:4326" }
            };
        }

        return responseData;
    }
    catch (error){
        console.error("Update Feature Error:", error);
        throw new Error(error.message);
    }
}

export const removeSpatialFeatures = async(layerId, featureId) => {
    const layer = await Layer.findByPk(layerId)
    if (!layer) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    let spatial
    switch(layer.geometryType) {
        case 'POINT': spatial = SpatialPoint; break;
        case 'LINE': spatial = SpatialLine; break;
        case 'POLYGON': spatial = SpatialPolygon; break;
        default : throw new UnprocessableEntityError('Terjadi kesalahan pada tipe layer');
    }

    const feature = await spatial.findOne({
        where: {
            id: featureId,
            layerId: layerId
        }
    })

    if (!feature) {
        throw new NotFoundError("Data spasial tidak ditemukan di layer ini")
    }

    try {
        await feature.destroy()
    }
    catch (error) {
        console.error("Delete Feature Error:", error)
        throw new Error(error.message)
    }
}