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
            { name: "Bangunan Gedung", slug: "bangunan-gedung", unit: "unit" },
            { name: "Total Luas Bangunan", slug: "total-luas-bangunan", unit: "hektar" }
        ]
    },
    {
        name: "Jaringan Jalan dan Jembatan",
        slug: "jaringan-jalan-dan-jembatan",
        subs: [
            { name: "Jaringan Jalan", slug: "jaringan-jalan", unit: "meter" },
            { name: "Jembatan", slug: "jembatan", unit: "unit" },
        ]
    },
    {
        name: "Drainase Perkotaan dan Pengendalian Banjir",
        slug: "drainase-perkotaan-dan-pengendalian-banjir",
        subs: [
            { name: "Drainase Perkotaan", slug: "drainase-perkotaan", unit: "meter" },
            { name: "Pengendalian Banjir", slug: "pengendalian-banjir", unit: "unit" }
        ]
    },
    {
        name: "Bangunan Sumber Daya Air dan Irigasi",
        slug: "bangunan-sumber-daya-air-dan-irigasi",
        subs: [
            { name: "Bangunan Sumber Daya Air", slug: "bangunan-sumber-daya-air", unit: "unit" },
            { name: "Irigasi", slug: "irigasi", unit: "meter" },
        ]
    },
    {
        name: "Jaringan Air Minum",
        slug: "jaringan-air-minum",
        subs: [
            { name: "Jaringan Air Minum", slug: "jaringan-air-minum", unit: "meter" }
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
        cat.accumulated_value = 0;
        cat.total_records = 0;

        cat.subs.forEach(sub => {
            sub.items_count = 0;
            sub.smart_value = 0;
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
    // STEP 3: HYBRID QUERY (COUNT + SUM PANJANG + SUM LUAS)
    // ---------------------------------------------------------
    const queryPromises = [];

    const pushHybridQuery = (Model, ids) => {
        if (ids.length === 0) return;

        // PERBAIKAN: Kita ambil dua metrik SUM sekaligus dari JSONB
        // Pastikan key 'luas' sesuai dengan nama property di GeoJSON Anda (bisa 'luas_bangunan' dsb)
        const sumPanjangLiteral = Sequelize.literal(`COALESCE(CAST("properties"->>'panjang' AS FLOAT), 0)`);
        const sumLuasLiteral = Sequelize.literal(`COALESCE(CAST("properties"->>'luasBangunan' AS FLOAT), 0)`);

        queryPromises.push(Model.findAll({
            attributes: [
                'layerId',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count_val'],
                [Sequelize.fn('SUM', sumPanjangLiteral), 'sum_panjang'],
                [Sequelize.fn('SUM', sumLuasLiteral), 'sum_luas'] // Tambahan query Luas
            ],
            where: { layerId: { [Op.in]: ids } },
            group: ['layerId'],
            raw: true
        }));
    };

    pushHybridQuery(SpatialPoint, idsByGeo.POINT);
    pushHybridQuery(SpatialLine, idsByGeo.LINE);
    pushHybridQuery(SpatialPolygon, idsByGeo.POLYGON);

    const allResults = (await Promise.all(queryPromises)).flat();

    // ---------------------------------------------------------
    // STEP 4: AGGREGATE & DECIDE
    // ---------------------------------------------------------
    for (const item of allResults) {
        const countVal = parseInt(item.count_val || 0, 10);
        let sumPanjang = parseFloat(item.sum_panjang || 0);
        let sumLuas = parseFloat(item.sum_luas || 0);

        const meta = layerMetaMap[item.layerId];
        if (meta) {
            const mapKey = `${meta.cat}:${meta.sub}`;
            const target = taxonomyMap[mapKey];

            if (target) {
                // 1. Update Sub-Category Normal (misal: Unit Bangunan)
                target.subRef.items_count += countVal;
                target.subRef.layers_count += 1;

                const isLengthUnit = ['kilometer', 'meter', 'm', 'km'].includes(target.unit.toLowerCase());
                let valueForUnit = isLengthUnit ? parseFloat(sumPanjang.toFixed(2)) : countVal;

                target.subRef.smart_value = (target.subRef.smart_value || 0) + valueForUnit;

                // 2. Update PARENT Category
                target.categoryRef.total_records += countVal;
                target.categoryRef.accumulated_value += valueForUnit;

                // 3. INJEKSI VIRTUAL: Jika layer ini adalah Bangunan Gedung
                if (meta.cat === 'bangunan-gedung' && meta.sub === 'bangunan-gedung') {
                    const luasTarget = taxonomyMap['bangunan-gedung:total-luas-bangunan'];
                    if (luasTarget) {
                        luasTarget.subRef.items_count += countVal;
                        luasTarget.subRef.layers_count += 1;
                        // Lempar hasil SUM Luas ke smart_value sub-kategori virtual ini
                        luasTarget.subRef.smart_value = (luasTarget.subRef.smart_value || 0) + sumLuas;

                        // CATATAN: Kita TIDAK menambahkan ke total_records parent lagi
                        // agar tidak terjadi perhitungan ganda (double count) di parent.
                    }
                }
            }
        }
    }

    // ---------------------------------------------------------
    // STEP 5: FINAL MAPPING
    // ---------------------------------------------------------
    return responseSkeleton.map(cat => ({
        category: cat.name,
        slug: cat.slug,
        total_assets: cat.total_records,
        unit_counts: parseFloat(cat.accumulated_value.toFixed(2)),

        sub_categories: cat.subs.map(sub => ({
            name: sub.name,
            slug: sub.slug,
            unit: sub.unit,
            total_assets: sub.items_count,
            unit_counts: parseFloat((sub.smart_value || 0).toFixed(2)),
            layers_count: sub.layers_count
        }))
    }));
};