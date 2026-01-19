import { promises as fs } from 'fs';
import crypto from 'crypto';
import shp from 'shpjs';
import _ from 'lodash';
import db from "../models/index.js";
import { BadRequestError, NotFoundError } from '../utils/custom-error.js';

const { Layer, LayerSchema, SpatialPoint, SpatialLine, SpatialPolygon, sequelize } = db;

export const importShapefileBulk = async (layerId, filePath) => {
    // 1. SETUP: Cek Layer & Schema
    const layer = await Layer.findByPk(layerId);
    if (!layer) throw new Error("Layer tidak ditemukan"); // Gunakan standard Error atau Custom Error Anda

    const schema = await LayerSchema.findOne({ where: { sub_category: layer.subCategory } }); // Perhatikan penulisan sub_category (snake_case di DB?)
    if (!schema) throw new Error(`Schema untuk kategori ${layer.subCategory} belum dibuat.`);

    let TargetModel;
    // Pastikan mapping model sesuai
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;

    const transaction = await sequelize.transaction();

    try {
        // 2. Baca & Parse SHP
        const buffer = await fs.readFile(filePath);
        let geojson = await shp(buffer);
        if (Array.isArray(geojson)) geojson = geojson[0];

        if (!geojson.features || geojson.features.length === 0) {
            throw new Error("File Shapefile kosong.");
        }

        // 3. MAPPING LOOP
        const toInsert = [];
        const candidatesForUpdate = [];
        const candidateIds = [];

        for (const feature of geojson.features) {
            // A. Mapping Row (PASSING LAYER OBJECT UNTUK CEK GEOMETRY TYPE)
            const mappedRow = mapFeatureToRow(feature, schema, layer, layerId);

            // Validasi: Jika geometri rusak/tidak sesuai tipe, mapFeatureToRow akan return null atau geom null
            if (!mappedRow || !mappedRow.geom) {
                console.warn("Skipping feature due to invalid geometry");
                continue;
            }

            // B. Cek System ID untuk Update
            const props = feature.properties;
            const systemId = props.systemId || props.system_id || props.uuid || props.SYS_ID || props.SYSTEM_ID;

            if (systemId) {
                mappedRow.id = systemId;
                candidatesForUpdate.push(mappedRow);
                candidateIds.push(systemId);
            } else {
                toInsert.push(mappedRow);
            }
        }

        // 4. DIRTY CHECKING (Optimasi Update)
        const finalUpdates = [];

        if (candidatesForUpdate.length > 0) {
            // Kolom fisik untuk compare. Pastikan sesuai definisi model.
            const compareAttrs = ['id', 'geom', 'properties', 'importHash', 'name', 'yearBuilt', 'condition'];

            const existingRows = await TargetModel.findAll({
                where: { id: candidateIds },
                attributes: compareAttrs
            });

            const existingMap = new Map(existingRows.map(row => [row.id, row]));

            candidatesForUpdate.forEach(newData => {
                const oldData = existingMap.get(newData.id);

                if (!oldData) {
                    // ID ada di SHP tapi tidak di DB -> Insert baru (Restore/Migrasi)
                    toInsert.push(newData);
                } else {
                    if (isDataChanged(newData, oldData)) {
                        finalUpdates.push(newData);
                    }
                }
            });
        }

        // 5. EKSEKUSI DATABASE
        let insertedCount = 0;
        let updatedCount = 0;

        // A. Insert
        if (toInsert.length > 0) {
            await TargetModel.bulkCreate(toInsert, {
                transaction,
                validate: true,
                individualHooks: true // Wajib true agar PostGIS memproses geometri GeoJSON -> Geometry
            });
            insertedCount = toInsert.length;
        }

        // B. Update
        if (finalUpdates.length > 0) {
            // Bulk update di Sequelize agak tricky untuk Hooks, kita loop promise
            const updatePromises = finalUpdates.map(item => {
                const { id, ...dataToUpdate } = item;
                return TargetModel.update(dataToUpdate, {
                    where: { id: item.id },
                    transaction,
                    individualHooks: true // Wajib true untuk proses geometri
                });
            });
            await Promise.all(updatePromises);
            updatedCount = finalUpdates.length;
        }

        await transaction.commit();
        await fs.unlink(filePath).catch(() => {});

        return {
            totalInFile: geojson.features.length,
            inserted: insertedCount,
            updated: updatedCount,
            ignored: candidatesForUpdate.length - updatedCount
        };

    } catch (error) {
        await transaction.rollback();
        await fs.unlink(filePath).catch(() => {});
        throw error; // Biar controller yang handle response error
    }
};

export const createLayerFromZip = async (file, metaData) => {
    const transaction = await sequelize.transaction(); // 1. Mulai Transaksi
    const filePath = file.path;

    try {
        // 2. Baca & Parse SHP
        const buffer = await fs.readFile(filePath);
        let geojson = await shp(buffer);

        // Handle jika zip berisi folder (shpjs return array)
        if (Array.isArray(geojson)) geojson = geojson[0];

        if (!geojson.features || geojson.features.length === 0) {
            throw new BadRequestError("File Shapefile kosong.");
        }

        // 3. DETEKSI OTOMATIS TIPE GEOMETRI
        // Kita intip data pertama untuk menentukan ini layer apa
        const firstGeomType = geojson.features[0].geometry.type;
        const dbGeometryType = mapGeoJSONTypeToLayerType(firstGeomType);

        // 4. Buat LAYER BARU
        // Nama layer diambil dari input body atau nama file zip
        const layerName = metaData.name || path.parse(file.originalname).name;

        const newLayer = await Layer.create({
            name: layerName,
            description: metaData.description || `Imported from ${file.originalname}`,
            geometryType: dbGeometryType, // <--- Hasil Deteksi Otomatis
            color: metaData.color || '#3388ff', // Default Blue
            isActive: true,
            metadata: {
                original_filename: file.originalname,
                imported_at: new Date()
            }
        }, { transaction });

        // 5. Tentukan Model Target (Sesuai hasil deteksi)
        let TargetModel;
        if (dbGeometryType === 'POINT') TargetModel = SpatialPoint;
        else if (dbGeometryType === 'LINE') TargetModel = SpatialLine;
        else if (dbGeometryType === 'POLYGON') TargetModel = SpatialPolygon;

        // 6. Mapping Data (Sama seperti logic import sebelumnya)
        const bulkData = geojson.features.map(feature => {
            const props = feature.properties || {};

            // Logic Mapping Kolom "Absolut"
            const year = props.TAHUN || props.YEAR || props.year_built || null;
            const condition = (props.REMARK && props.REMARK.toLowerCase().includes('rusak')) ? 'Rusak' : 'Baik';

            // Generate Hash (Tetap kita pakai untuk konsistensi data)
            const uniqueString = `${newLayer.id}_${JSON.stringify(feature.geometry)}`;
            const hash = crypto.createHash('md5').update(uniqueString).digest('hex');

            const geoJsonString = JSON.stringify(feature.geometry);

            // 1. Ubah JSON jadi Geometry
            let geomFn = sequelize.fn('ST_GeomFromGeoJSON', geoJsonString);

            // 2. Jika Line/Polygon, paksa jadi MULTI (karena DB biasanya Multi)
            //    Jika Point, biasanya tidak perlu Multi (kecuali DB anda MultiPoint)
            if (dbGeometryType !== 'POINT') {
                geomFn = sequelize.fn('ST_Multi', geomFn);
            }

            // 3. Set SRID ke 4326 (WGS84)
            geomFn = sequelize.fn('ST_SetSRID', geomFn, 4326);

            // 4. SOLUSI ERROR Z-DIMENSION: Paksa jadi 3D (Z=0)
            geomFn = sequelize.fn('ST_Force3D', geomFn);

            return {
                layerId: newLayer.id,
                name: props.NAMOBJ || 'No Name',

                // Kolom Absolut
                yearBuilt: year ? parseInt(year) : null,
                regNumber: props.NOREG || null,
                assetCode: props.JNSRSR ? String(props.JNSRSR) : null,
                condition: condition,
                managedBy: props.WADMPR || 'Pemkot',

                importHash: hash,
                properties: props,

                // Masukkan Function yg sudah dirakit tadi, BUKAN raw geometry
                geom: geomFn
            };
        });

        // 7. Eksekusi Bulk Insert
        await TargetModel.bulkCreate(bulkData, {
            transaction, // WAJIB: Masuk transaction yang sama
            validate: true,
            hooks: true // Agar ST_Multi/ST_Force3D jalan
        });

        // 8. Commit (Simpan Permanen)
        await transaction.commit();

        // Bersihkan file temp
        await fs.unlink(filePath).catch(()=>{});

        return {
            layer: newLayer,
            totalFeatures: bulkData.length
        };

    } catch (error) {
        // ROLLBACK: Batalkan pembuatan layer jika ada error sekecil apapun
        await transaction.rollback();

        await fs.unlink(filePath).catch(()=>{});
        console.error("Create Layer Import Error:", error);
        throw error;
    }
};



// ---------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------

/**
 * Mengubah Feature GeoJSON -> Object Row Database
 * Menggunakan Schema untuk pemetaan cerdas
 */
const mapFeatureToRow = (feature, schema, layer, layerId) => {
    // 1. Kamus Mapping Kolom Fisik (Mapping Key Schema -> Kolom DB)
    const PHYSICAL_MAP = {
        'nama': 'name',
        'tahunPengadaan': 'yearBuilt',
        'noRegister': 'regNumber',
        'nomorRegister': 'regNumber',
        'NO_REGIS': 'regNumber', // Jaga-jaga
        'pemilik': 'managedBy',
        'diolah': 'managedBy',
        'sumberData': 'dataSource',
        'kondisi': 'condition'
    };

    // 2. SANITASI GEOMETRI (Fix 3D & Single/Multi Type)
    let sanitizedGeom;
    try {
        sanitizedGeom = fixGeometry(feature.geometry, layer.geometryType);
    } catch (e) {
        console.error("Geometry Error:", e.message);
        return null; // Skip jika geometri rusak
    }

    if (!sanitizedGeom) return null;

    // 3. Generate Hash & Setup Awal
    const geomHash = crypto.createHash('md5')
        .update(JSON.stringify(sanitizedGeom))
        .digest('hex');

    const rowData = {
        layerId,
        geom: sanitizedGeom,
        importHash: geomHash,
        name: "Tanpa Nama", // Default value
        properties: {}
    };

    const rawProps = feature.properties || {};
    const rawKeys = Object.keys(rawProps);

    const normalize = (str) => (str ? str.toString().toLowerCase().trim() : '');

    // console.log("==========================================");
    // console.log("FILE HEADERS (RAW PROPS):", Object.keys(rawProps));
    // console.log("==========================================\n");

    // 4. Schema Mapping Loop
    schema.definition.forEach(rule => {
        // console.log("===START ROW DATA===")
        // console.log(rule)
        let val = undefined;

        // --- A. Cek Exact Match (Prioritas 1) ---
        if (rawProps[rule.key] !== undefined) {
            // console.log("1st block if, I'M Properties")
            val = rawProps[rule.key];
        }

        // --- B. Cek Import Alias (Prioritas 2) ---
        if (val === undefined && rule.import_alias && Array.isArray(rule.import_alias)) {
            // console.log("2nd block if, I'M Import")
            // Cari header file yang lowercase-nya cocok dengan salah satu alias lowercase
            const matchKey = rawKeys.find(headerKey => {
                const normHeader = normalize(headerKey);
                return rule.import_alias.some(alias => normalize(alias) === normHeader);
            });

            if (matchKey) val = rawProps[matchKey];
        }

        // --- C. Cek Export Alias (Prioritas 3 - THE FIX) ---
        if (val === undefined && rule.export_alias) {
            // console.log("3rd block if, I'M Export")
            // Cari header file yang lowercase-nya SAMA PERSIS dengan export_alias lowercase
            const targetAlias = normalize(rule.export_alias);

            const matchKey = rawKeys.find(headerKey =>
                normalize(headerKey) === targetAlias
            );

            if (matchKey) val = rawProps[matchKey];
        }

        // --- STEP D: Fallback 'Soft Match' (Opsional tapi berguna) ---
        if (val === undefined) {
            // console.log("4th block if, I'M Fallback")
            const cleanKeySchema = normalize(rule.key).replace(/_/g, '');
            const matchKey = rawKeys.find(headerKey =>
                normalize(headerKey).replace(/_/g, '') === cleanKeySchema
            );
            if (matchKey) val = rawProps[matchKey];
        }

        console.log("Value :", val)

        // --- D. Penempatan Data (Placement) ---
        if (val !== undefined && val !== null) {
            // Bersihkan spasi jika string
            if (typeof val === 'string') val = val.trim();

            // Cek apakah key ini harus masuk ke kolom fisik DB?
            const targetPhysicalCol = PHYSICAL_MAP[rule.key];
            // console.log("targetPhysicalCol :", targetPhysicalCol);

            if (targetPhysicalCol) {
                rowData[targetPhysicalCol] = val; // Masuk ke root (misal: yearBuilt)
            } else {
                rowData.properties[rule.key] = val; // Masuk ke properties JSONB
            }
        }
        // console.log("===END ROW DATA===\n")
    });

    // 5. Fallback Name (Safety Net)
    // Jika dari loop di atas 'nama' belum ketemu, kita cari kolom umum
    if (rowData.name === "Tanpa Nama") {
        // Cari manual case-insensitive untuk NAMOBJ / NAME / NAMA
        const potentialNameKeys = ['NAMOBJ', 'NAME', 'NAMA', 'NM_JALAN'];

        const fallbackKey = rawKeys.find(k =>
            potentialNameKeys.includes(k.toUpperCase().trim())
        );

        if (fallbackKey && rawProps[fallbackKey]) {
            rowData.name = rawProps[fallbackKey];
        }
        // Cek juga barangkali masuk ke properties.nama tapi lupa di-map ke fisik
        else if (rowData.properties.nama) {
            rowData.name = rowData.properties.nama;
        }
    }

    return rowData;
};

const isDataChanged = (newData, oldData) => {
    // 1. Cek Hash Geometri
    // Pastikan di Model Sequelize Anda, kolom 'import_hash' dimapping ke 'importHash'
    if (oldData.importHash && newData.importHash) {
        if (newData.importHash !== oldData.importHash) return true;
    } else {
        // Fallback jika hash null di DB lama
        // Warning: JSON.stringify geometry mungkin beda urutan key, tapi cukup untuk fallback
        if (JSON.stringify(newData.geom) !== JSON.stringify(oldData.geom)) return true;
    }

    // 2. Cek Kolom Fisik
    if (newData.condition !== oldData.condition) return true;
    // Pakai loose equality (==) karena kadang DB return string "2020", SHP return int 2020
    if (newData.yearBuilt != oldData.yearBuilt) return true;
    if (newData.name !== oldData.name) return true;

    // 3. Cek Properties
    if (!_.isEqual(newData.properties, oldData.properties)) return true;

    return false;
};

/**
 * Memaksa koordinat menjadi 3D [x, y, 0] jika inputnya hanya 2D [x, y].
 * Solusi untuk error: "Column has Z dimension but geometry does not"
 */
const ensure3D = (coords) => {
    if (!Array.isArray(coords)) return coords;

    // Cek Base Case: Array angka [x, y]
    if (coords.length > 0 && typeof coords[0] === 'number') {
        if (coords.length === 2) {
            return [coords[0], coords[1], 0]; // Tambah Z=0
        }
        return coords;
    }
    // Recursive Case (Line/Polygon)
    return coords.map(ensure3D);
};

/**
 * Memperbaiki Geometri:
 * 1. Auto Cast Single -> Multi (misal Polygon -> MultiPolygon)
 * 2. Auto Force 3D (tambah Z index)
 */
const fixGeometry = (geojsonGeom, targetTypeDB) => {
    if (!geojsonGeom || !geojsonGeom.type) return null;

    let finalGeom = { ...geojsonGeom };
    const inputType = finalGeom.type;
    const targetType = targetTypeDB.toUpperCase(); // 'LINE', 'POLYGON', 'POINT'

    // STEP 1: FORCE 3D
    finalGeom.coordinates = ensure3D(finalGeom.coordinates);

    // STEP 2: CASTING TYPE
    // Kasus: DB butuh POLYGON (MultiPolygon)
    if (targetType === 'POLYGON') {
        if (inputType === 'Polygon') {
            return { type: 'MultiPolygon', coordinates: [finalGeom.coordinates] };
        }
        if (inputType === 'MultiPolygon') return finalGeom;
    }
    // Kasus: DB butuh LINE (MultiLineString)
    else if (targetType === 'LINE') {
        if (inputType === 'LineString') {
            return { type: 'MultiLineString', coordinates: [finalGeom.coordinates] };
        }
        if (inputType === 'MultiLineString') return finalGeom;
    }

    return finalGeom; // Default return (misal Point)
};