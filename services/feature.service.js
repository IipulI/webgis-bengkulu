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

const FIXED_TAXONOMY = [
    {
        name: "Bangunan Gedung",
        slug: "bangunan-gedung",
        subs: [
            { name: "Bangunan Gedung", slug: "bangunan-gedung" }
        ]
    },
    {
        name: "Jaringan Jalan dan Jembatan",
        slug: "jaringan-jalan-dan-jembatan",
        subs: [
            { name: "Jaringan", slug: "jaringan" },
            { name: "Jalan", slug: "jalan" },
            { name: "Jembatan", slug: "jembatan" }
        ]
    },
    {
        name: "Drainase Perkotaan dan Pengendalian Banjir",
        slug: "drainase-perkotaan-dan-pengendalian-banjir",
        subs: [
            { name: "Drainase Perkotaan", slug: "drainase-perkotaan" },
            { name: "Pengendalian Banjir", slug: "pengendalian-banjir" }
        ]
    },
    {
        name: "Bangunan Sumber Daya Air dan Irigasi",
        slug: "bangunan-sumber-daya-air-dan-irigasi",
        subs: [
            { name: "Bangunan Sumber Daya Air", slug: "bangunan-sumber-daya-air" },
            { name: "Irigasi", slug: "irigasi" }
        ]
    },
    {
        name: "Jaringan Air Minum",
        slug: "jaringan-air-minum",
        subs: [
            { name: "Jaringan Air Minum", slug: "jaringan-air-minum" }
        ]
    },
    {
        name: "Pengolahaan Air Limbah dan Limbah B3 dan Sanitasi",
        slug: "pengolahaan-air-limbah-dan-limbah-b3-dan-sanitasi",
        subs: [
            { name: "Pengendalian Air Limbah", slug: "pengendalian-air-limbah" },
            { name: "Pengendalian Limbah B3", slug: "pengendalian-limbah-b3" },
            { name: "Sanitasi", slug: "sanitasi" }
        ]
    }
];

export const getAssetsByCategory = async () => {
    // --- STEP 2: BUILD SKELETON ---
    const result = FIXED_TAXONOMY.map(template => ({
        category: template.name,
        _db_slug: template.slug,
        total_assets: 0,
        sub_categories: template.subs.map(sub => ({
            name: sub.name,
            _db_slug: sub.slug,
            total_assets: 0,
            layers_count: 0
        }))
    }));

    // --- STEP 3: FETCH DATA FROM DB ---
    const layers = await Layer.findAll({
        where: { isActive: true },
        attributes: ['id', 'geometryType', 'category', 'subCategory']
    });

    const layerStatsPromises = layers.map(async (layer) => {
        let TargetModel;
        if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
        else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
        else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;
        else return null;

        const count = await TargetModel.count({ where: { layerId: layer.id } });

        return {
            category: layer.category ? layer.category.toLowerCase().trim() : '',
            subCategory: layer.subCategory ? layer.subCategory.toLowerCase().trim() : '',
            count: count
        };
    });

    const rawStats = (await Promise.all(layerStatsPromises)).filter(item => item !== null);

    // --- STEP 4: FILL DATA (MATCHING BY SLUG) ---
    rawStats.forEach(stat => {
        const targetCategory = result.find(r => r._db_slug === stat.category);

        if (targetCategory) {
            const targetSub = targetCategory.sub_categories.find(s => s._db_slug === stat.subCategory);

            if (targetSub) {
                targetSub.total_assets += stat.count;
                targetSub.layers_count += 1;
                targetCategory.total_assets += stat.count;
            }
        }
    });

    // --- STEP 5: FINAL CLEANUP & FORMATTING ---
    // Di sini kita mapping ulang agar properti 'slug' masuk ke output final
    const finalResult = result.map(cat => {
        return {
            category: cat.category,
            slug: cat._db_slug, // <--- UPDATE: Masukkan Slug Kategori ke Response
            total_assets: cat.total_assets,
            sub_categories: cat.sub_categories.map(sub => ({
                name: sub.name,
                slug: sub._db_slug, // <--- UPDATE: Masukkan Slug Sub-Kategori ke Response
                total_assets: sub.total_assets,
                layers_count: sub.layers_count
            }))
        };
    });

    return finalResult;
};