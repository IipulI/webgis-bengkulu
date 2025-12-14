import fs from 'fs/promises';
import shp from 'shpjs';
import crypto from 'crypto';
import path from 'path';
import db from "../models/index.js";
import { BadRequestError, NotFoundError } from '../utils/custom-error.js';
import { mapGeoJSONTypeToLayerType } from "../utils/geojson-type.js";

const { Layer, SpatialPoint, SpatialLine, SpatialPolygon, sequelize } = db;

export const importShapefileBulk = async (layerId, filePath) => {
    // 1. Cek Layer & Tentukan Model Target
    const layer = await Layer.findByPk(layerId);
    if (!layer) throw new NotFoundError("Layer tidak ditemukan");

    let TargetModel;
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;

    try {
        // 2. Baca File ZIP
        const buffer = await fs.readFile(filePath);
        let geojson = await shp(buffer);

        // Handle jika di dalam zip ada folder (shpjs return array)
        if (Array.isArray(geojson)) geojson = geojson[0];

        if (!geojson.features || geojson.features.length === 0) {
            throw new BadRequestError("File Shapefile kosong atau tidak valid.");
        }

        const entriesToInsert = []; // Antrian Barang Baru / Tanpa ID
        const entriesToUpdate = []; // Antrian Barang Revisi / Punya ID

        // 3. Mapping Loop
        for (const feature of geojson.features) {
            const props = feature.properties || {};

            // A. Normalisasi Atribut (Mapping Cerdas)
            // Mapping Kondisi
            let condition = 'Baik';
            const remark = props.REMARK || props.remark || '';
            if (remark && typeof remark === 'string' && remark.toLowerCase().includes('rusak')) {
                condition = 'Rusak';
            } else if (props.KONDISI) {
                condition = props.KONDISI;
            }

            // Mapping Kode Aset & Tahun
            const assetCode = props.JNSRSR || props.ORDE01 || props.ORDE02 || props.CODE || null;
            const year = props.TAHUN || props.YEAR || props.year_built || null;
            const regNum = props.NOREG || props.reg_number || null;
            const source = props.SBDATA || props.data_source || 'Import SHP';
            const owner = props.WADMPR || props.WADMKK || props.managed_by || 'Pemkot';

            // Nama Objek
            const name = props.NAMOBJ || props.Name || props.NAME || 'Imported Feature';

            // B. Generate Digital Fingerprint (Hash)
            // Hash = LayerID + String Geometry.
            // Jika koordinat geser 0.00001 saja, hash berubah -> dianggap baru.
            const uniqueString = `${layerId}_${JSON.stringify(feature.geometry)}`;
            const hash = crypto.createHash('md5').update(uniqueString).digest('hex');

            // C. Cek System ID (Round-Trip Strategy)
            // SHP memotong nama kolom jadi 10 char, jadi cek variasi-nya
            const systemId = props.system_id || props.SYSTEM_ID || props.uuid || props.UUID;

            const payload = {
                layerId,
                name,

                // Kolom Fisik (Promoted Columns)
                yearBuilt: year ? parseInt(year) : null,
                regNumber: regNum,
                assetCode: assetCode ? String(assetCode) : null,
                condition,
                managedBy: owner,
                dataSource: source,

                importHash: hash, // Simpan Hash

                properties: props, // Simpan semua raw data di JSONB
                geom: feature.geometry // GeoJSON Mentah (Hook Model yg akan handle ST_Multi)
            };

            if (systemId) {
                // JALUR 1: UPDATE (Punya KTP/ID)
                payload.id = systemId;
                entriesToUpdate.push(payload);
            } else {
                // JALUR 2: INSERT / UPSERT (Tanpa ID)
                entriesToInsert.push(payload);
            }
        }

        // 4. Eksekusi Database
        let insertedCount = 0;
        let updatedCount = 0;

        // A. Batch Insert (dengan Logic Anti-Duplikat Hash)
        if (entriesToInsert.length > 0) {
            await TargetModel.bulkCreate(entriesToInsert, {
                validate: true,
                hooks: true, // Wajib TRUE agar ST_Multi/ST_Force3D jalan

                // ON CONFLICT (layer_id, import_hash) DO UPDATE ...
                updateOnDuplicate: ['name', 'properties', 'condition', 'yearBuilt', 'updatedAt'],
                conflictAttributes: ['layer_id', 'import_hash']
            });
            insertedCount = entriesToInsert.length;
        }

        // B. Batch Update (Looping karena update bulk by ID susah di Sequelize)
        // Kita pakai Promise.all agar parallel dan cepat
        if (entriesToUpdate.length > 0) {
            const updatePromises = entriesToUpdate.map(item => {
                return TargetModel.update({
                    name: item.name,
                    geom: sequelize.fn(
                        'ST_Force3D',
                        sequelize.fn('ST_SetSRID',
                            sequelize.fn('ST_Multi', sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(item.geom))),
                            4326)
                    ),
                    properties: item.properties,
                    condition: item.condition,
                    yearBuilt: item.yearBuilt,
                    updatedAt: new Date()
                }, {
                    where: { id: item.id, layerId: layerId } // Safety: Pastikan ID dan Layer cocok
                });
            });

            await Promise.all(updatePromises);
            updatedCount = entriesToUpdate.length;
        }

        // Cleanup File Temp
        await fs.unlink(filePath).catch(() => {});

        return {
            totalProcessed: entriesToInsert.length + entriesToUpdate.length,
            insertedOrSkipped: insertedCount,
            updatedById: updatedCount
        };

    } catch (error) {
        // Selalu hapus file temp jika error
        await fs.unlink(filePath).catch(() => {});
        console.error("Import Error:", error);
        throw error;
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