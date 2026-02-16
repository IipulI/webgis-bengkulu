import models from '../models/index.js'
import { sequelize } from "../config/database.js";
import { NotFoundError, UnprocessableEntityError } from "../utils/custom-error.js";
import { Op, Sequelize } from "sequelize";


const { FeatureAttachment, Layer, LayerSchema, SpatialLine, SpatialPoint, SpatialPolygon } = models

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
            },
            {
                model: Layer,
                as: 'layer',
                attributes: ['id', 'category', 'subCategory']
            }
        ]
    });

    if (!feature) throw new NotFoundError("Data spasial tidak ditemukan");

    const layerSchema = await LayerSchema.findOne({
        where: {
            subCategory : {
                [Op.in]: [feature.layer.category, feature.layer.subCategory]
            }
        }
    })

    return {
        feature: feature,
        layerSchema: layerSchema
    };
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

        if (spatialData.regNumber !== undefined) {
            updatePayload.regNumber = spatialData.regNumber
        }

        if (spatialData.yearBuilt !== undefined) {
            updatePayload.yearBuilt = spatialData.yearBuilt
        }

        if (spatialData.dataSource !== undefined) {
            updatePayload.dataSource = spatialData.dataSource
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
            { name: "Bangunan Gedung", slug: "bangunan-gedung", unit: "unit" }
        ]
    },
    {
        name: "Jaringan Jalan dan Jembatan",
        slug: "jaringan-jalan-dan-jembatan",
        subs: [
            { name: "Jaringan Jalan", slug: "jaringan-jalan", unit: "kilometer" },
            { name: "Jembatan", slug: "jembatan", unit: "unit" },
        ]
    },
    {
        name: "Drainase Perkotaan dan Pengendalian Banjir",
        slug: "drainase-perkotaan-dan-pengendalian-banjir",
        subs: [
            { name: "Drainase Perkotaan", slug: "drainase-perkotaan", unit: "unit" },
            { name: "Pengendalian Banjir", slug: "pengendalian-banjir", unit: "unit" }
        ]
    },
    {
        name: "Bangunan Sumber Daya Air dan Irigasi",
        slug: "bangunan-sumber-daya-air-dan-irigasi",
        subs: [
            { name: "Bangunan Sumber Daya Air", slug: "bangunan-sumber-daya-air", unit: "unit" },
            { name: "Irigasi", slug: "irigasi", unit: "kilometer" },
        ]
    },
    {
        name: "Jaringan Air Minum",
        slug: "jaringan-air-minum",
        subs: [
            { name: "Jaringan Air Minum", slug: "jaringan-air-minum", unit: "kilometer" }
        ]
    },
    {
        name: "Pengolahaan Air Limbah dan Limbah B3 dan Sanitasi",
        slug: "pengolahaan-air-limbah-dan-limbah-b3-dan-sanitasi",
        subs: [
            { name: "Pengendalian Air Limbah dan Limbah B3", slug: "pengendalian-air-limbah-dan-limbah-b3", unit: "unit" },
            { name: "Sanitasi", slug: "sanitasi", unit: "unit" }
        ]
    }
];

export const getAssetsByCategory = async () => {
    // ---------------------------------------------------------
    // STEP 1: PREPARE SKELETON
    // ---------------------------------------------------------
    const responseSkeleton = JSON.parse(JSON.stringify(FIXED_TAXONOMY));
    const taxonomyMap = {};

    responseSkeleton.forEach(cat => {
        // PERBAIKAN: Kita butuh dua counter terpisah di level Parent
        cat.accumulated_value = 0; // Untuk menampung (Km + Unit)
        cat.total_records = 0;     // Untuk menampung jumlah baris data (153 + 25)

        cat.subs.forEach(sub => {
            sub.items_count = 0;   // Jumlah baris (Record Count)
            sub.smart_value = 0;   // Nilai berdasarkan unit (Km atau Unit)
            sub.layers_count = 0;

            const key = `${cat.slug}:${sub.slug}`;
            taxonomyMap[key] = {
                categoryRef: cat,
                subRef: sub,
                unit: sub.unit
            };
        });
    });

    // ---------------------------------------------------------
    // STEP 2: FETCH LAYERS
    // ---------------------------------------------------------
    const layers = await Layer.findAll({
        where: { isActive: true },
        attributes: ['id', 'geometryType', 'category', 'subCategory'],
        raw: true
    });

    const layerMetaMap = {};
    // Kita tidak perlu memisah count/sum bucket lagi.
    // Cukup pisah berdasarkan geometri saja.
    const idsByGeo = { POINT: [], LINE: [], POLYGON: [] };

    for (const layer of layers) {
        const catSlug = layer.category ? layer.category.trim() : '';
        const subSlug = layer.subCategory ? layer.subCategory.trim() : '';

        layerMetaMap[layer.id] = { cat: catSlug, sub: subSlug };

        if (idsByGeo[layer.geometryType]) {
            idsByGeo[layer.geometryType].push(layer.id);
        }
    }

    // ---------------------------------------------------------
    // STEP 3: HYBRID QUERY (COUNT + SUM SEKALIGUS)
    // ---------------------------------------------------------
    const queryPromises = [];

    // Fungsi helper query yang lebih pintar
    const pushHybridQuery = (Model, ids) => {
        if (ids.length === 0) return;

        // Logic SUM JSONB (Postgres)
        // Jika property 'panjang' tidak ada, hasilnya null -> di-COALESCE jadi 0.
        // Jadi aman dijalankan untuk layer yang tidak punya panjang sekalipun.
        const sumLiteral = Sequelize.literal(
            `COALESCE(CAST("properties"->>'panjang' AS FLOAT), 0)`
        );

        queryPromises.push(Model.findAll({
            attributes: [
                'layerId',
                // 1. Selalu ambil COUNT
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count_val'],
                // 2. Selalu ambil SUM (biar nanti logic JS yang milih mau pakai yang mana)
                [Sequelize.fn('SUM', sumLiteral), 'sum_val']
            ],
            where: { layerId: { [Op.in]: ids } },
            group: ['layerId'],
            raw: true
        }));
    };

    // Eksekusi Query
    pushHybridQuery(SpatialPoint, idsByGeo.POINT);
    pushHybridQuery(SpatialLine, idsByGeo.LINE);      // Target utama (Jalan)
    pushHybridQuery(SpatialPolygon, idsByGeo.POLYGON);

    const allResults = (await Promise.all(queryPromises)).flat();

    // ---------------------------------------------------------
    // STEP 4: AGGREGATE & DECIDE
    // ---------------------------------------------------------
    for (const item of allResults) {
        const countVal = parseInt(item.count_val || 0, 10);
        let sumVal = parseFloat(item.sum_val || 0);

        const meta = layerMetaMap[item.layerId];
        if (meta) {
            const mapKey = `${meta.cat}:${meta.sub}`;
            const target = taxonomyMap[mapKey];

            if (target) {
                // 1. Update Sub-Category Stats
                target.subRef.items_count += countVal;
                target.subRef.layers_count += 1;

                // Hitung nilai satuan (Km vs Unit)
                const isLengthUnit = ['kilometer', 'meter', 'm', 'km'].includes(target.unit.toLowerCase());
                let valueForUnit = isLengthUnit ? parseFloat(sumVal.toFixed(2)) : countVal;

                target.subRef.smart_value = (target.subRef.smart_value || 0) + valueForUnit;

                // 2. Update PARENT Category Stats (PERBAIKAN DISINI)

                // A. Akumulasi Record (Agar totalnya 178, bukan 113ribu)
                target.categoryRef.total_records += countVal;

                // B. Akumulasi Value (Tetap kita simpan jika butuh total 'mixed')
                target.categoryRef.accumulated_value += valueForUnit;
            }
        }
    }

    // ---------------------------------------------------------
    // STEP 5: FINAL MAPPING (Backend -> Frontend Structure)
    // ---------------------------------------------------------
    return responseSkeleton.map(cat => ({
        category: cat.name,
        slug: cat.slug,

        // --- PERBAIKAN UTAMA DI SINI ---

        // 1. total_assets: Sekarang berisi jumlah RECORD (153 + 25 = 178)
        total_assets: cat.total_records,

        // 2. unit_counts: Berisi total nilai campuran (113146 + 25 = 113171)
        // (Ini opsional, kalau tidak butuh di parent, bisa dihapus)
        unit_counts: parseFloat(cat.accumulated_value.toFixed(2)),

        sub_categories: cat.subs.map(sub => ({
            name: sub.name,
            slug: sub.slug,
            unit: sub.unit,

            // Sub-category tetap konsisten:
            total_assets: sub.items_count, // Jumlah Record (misal: 153)
            unit_counts: parseFloat((sub.smart_value || 0).toFixed(2)), // Nilai Unit (misal: 113146.52)

            layers_count: sub.layers_count
        }))
    }));
};