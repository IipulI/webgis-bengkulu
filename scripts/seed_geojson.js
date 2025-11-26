import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/index.js';

const { sequelize, Layer, SpatialPoint, SpatialLine, SpatialPolygon, User } = db;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GEOJSON_DIR = path.join(__dirname, '../geojsons');

const TYPE_MAPPING = {
    'Point': { model: SpatialPoint, type: 'POINT' },
    'MultiPoint': { model: SpatialPoint, type: 'POINT' },
    'LineString': { model: SpatialLine, type: 'LINE' },
    'MultiLineString': { model: SpatialLine, type: 'LINE' },
    'Polygon': { model: SpatialPolygon, type: 'POLYGON' },
    'MultiPolygon': { model: SpatialPolygon, type: 'POLYGON' }
};

// --- FUNGSI PENTING: FORCE 3D (X, Y, Z=0) ---
// Jika koordinat cuma 2 biji (X, Y), tambahkan 0 di belakangnya.
function ensure3D(coords) {
    if (!Array.isArray(coords)) return coords;

    // Cek apakah ini level koordinat paling dasar [num, num, ?]
    if (coords.length >= 2 && typeof coords[0] === 'number') {
        if (coords.length === 2) {
            // Kasus 2D: [X, Y] -> Ubah jadi [X, Y, 0]
            return [coords[0], coords[1], 0];
        }
        // Kasus 3D/4D: [X, Y, Z] -> Biarkan apa adanya
        return coords;
    }

    // Jika ini Array of Arrays (Polygon/LineString), gali lebih dalam (Recursive)
    return coords.map(ensure3D);
}
// ------------------------------------------------

async function importFile(filename) {
    try {
        console.log(`\n📂 Memproses file: ${filename}...`);

        const filePath = path.join(GEOJSON_DIR, filename);
        const rawData = await fs.readFile(filePath, 'utf-8');
        const geojson = JSON.parse(rawData);

        if (!geojson.features || geojson.features.length === 0) {
            console.warn(`⚠️ File ${filename} kosong.`);
            return;
        }

        const firstType = geojson.features[0].geometry.type;
        const mapping = TYPE_MAPPING[firstType];

        if (!mapping) {
            console.error(`❌ Tipe geometri tidak dikenali: ${firstType}`);
            return;
        }

        // Cek/Buat Layer
        const layerName = geojson.name || filename.replace('.json', '');
        let layer = await Layer.findOne({ where: { name: layerName } });

        if (!layer) {
            layer = await Layer.create({
                name: layerName,
                geometryType: mapping.type,
                metadata: {
                    crs: geojson.crs,
                    // Simpan resolusi asli, tidak perlu diubah
                    xy_coordinate_resolution: geojson.xy_coordinate_resolution,
                    z_coordinate_resolution: geojson.z_coordinate_resolution,
                    original_filename: filename
                },
                isActive: true,
                color: getRandomColor()
            });
            console.log(`✅ Layer dibuat: ${layer.name}`);
        } else {
            console.log(`ℹ️ Layer sudah ada: ${layer.name}, menambahkan data...`);
        }

        const adminUser = await User.findOne();
        const adminId = adminUser ? adminUser.id : null;

        const featuresData = geojson.features.map(feature => {
            // APLIKASIKAN LOGIKA 3D DISINI
            const coordinates3D = ensure3D(feature.geometry.coordinates);

            const geometry3D = {
                type: feature.geometry.type,
                coordinates: coordinates3D
            };

            return {
                layerId: layer.id,
                name: feature.properties.NAMOBJ || 'Tanpa Nama',
                properties: feature.properties,
                geom: geometry3D, // Sekarang AMAN untuk kolom POINTZ/POLYGONZ
                createdBy: adminId
            };
        });

        await mapping.model.bulkCreate(featuresData);
        console.log(`🚀 Berhasil import ${featuresData.length} data ke tabel ${mapping.model.tableName}.`);

    } catch (error) {
        console.error(`❌ Gagal import ${filename}:`, error.message);
    }
}

function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

(async () => {
    try {
        await sequelize.authenticate();
        console.log('🔌 Koneksi database berhasil.');

        const files = [
            'air_minum.json',
            'drainase.json',
            'energi.json',
            'persampahan.json',
            'prasarana_lain.json',
            'pusat_pelayanan.json',
            'sda.json',
            'telekomunikasi.json',
            'transportasi.json',
            'zonasi.json'
        ];

        for (const file of files) {
            await importFile(file);
        }

        console.log('\n🎉 SEMUA PROSES SELESAI!');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
})();