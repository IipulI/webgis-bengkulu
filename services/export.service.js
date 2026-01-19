import db from "../models/index.js";
import mapshaper from 'mapshaper';
import tokml from 'tokml';

const { Layer, LayerSchema, SpatialPoint, SpatialLine, SpatialPolygon, FeatureAttachment } = db;

// ==========================================
// 1. KONFIGURASI & HELPER
// ==========================================

// Peta Mapping: Key Schema (JSON) -> Atribut Model Sequelize (Database Fisik)
const PHYSICAL_MAP = {
    'nama': 'name',
    'tahunPengadaan': 'yearBuilt',
    'tahunPerbaikanTerakhir': 'yearBuilt',
    'noRegister': 'regNumber',
    'nomorRegister': 'regNumber',
    'kodeAset': 'assetCode',
    'pemilik': 'managedBy',
    'sumberData': 'dataSource',
    'kondisi': 'condition'
};

/**
 * Membersihkan nilai agar aman ditulis ke format DBF (Shapefile).
 * Mencegah error "Mismatch" karena nilai null/undefined.
 */
const cleanValue = (val) => {
    if (val === null || val === undefined) return ""; // Wajib string kosong
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 250);
    if (typeof val === 'string') return val.replace(/\r?\n|\r/g, " ").trim(); // Hapus Enter/Newline
    return val;
};

/**
 * Membuang koordinat Z (3D) menjadi 2D [x, y].
 * Library shp-write terkadang gagal menulis geometri 3D, menyebabkan mismatch.
 */
const stripZ = (coords) => {
    if (!Array.isArray(coords)) return coords;
    if (coords.length === 0) return coords;

    // Base case: [x, y, z] -> ambil 2 depan saja
    if (typeof coords[0] === 'number') {
        return coords.slice(0, 2);
    }
    // Recursive case (untuk Line/Polygon)
    return coords.map(stripZ);
};

// ==========================================
// 2. MAIN FUNCTION
// ==========================================

export const exportLayerData = async (layerId, format = 'shp') => {
    // --- STEP A: VALIDASI LAYER & SCHEMA ---
    const layer = await Layer.findByPk(layerId);
    if (!layer) throw new Error("Layer tidak ditemukan");

    // Ambil Schema Definition
    const schema = await LayerSchema.findOne({
        where: { sub_category: layer.subCategory }
    });

    if (!schema || !schema.definition) {
        throw new Error(`Schema definition tidak ditemukan untuk kategori: ${layer.subCategory}`);
    }
    const definitions = schema.definition;

    // --- STEP B: TENTUKAN TARGET MODEL ---
    let TargetModel;
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;
    else throw new Error("Tipe geometri layer tidak dikenali");

    // --- STEP C: AMBIL DATA ---
    const features = await TargetModel.findAll({
        where: { layerId },
        include: [
            {
                model: FeatureAttachment,
                as: 'attachments',
                limit: 1,
                attributes: ['fileUrl'],
                order: [['created_at', 'DESC']]
            }
        ],
        attributes: [
            'id', 'name', 'geom', 'properties',
            'yearBuilt', 'regNumber', 'assetCode',
            'managedBy', 'dataSource', 'condition'
        ]
    });

    if (features.length === 0) throw new Error("Layer ini kosong (tidak ada data).");

    const targetFormat = format.toLowerCase();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // --- STEP D: MAPPING & SANITASI ---
    const geojsonFeatures = features
        .map(item => {
            const plain = item.toJSON();

            // 1. Validasi Geometri (Critical Check)
            if (!plain.geom || !plain.geom.coordinates) return null;
            if (Array.isArray(plain.geom.coordinates) && plain.geom.coordinates.length === 0) return null;

            // 2. Sanitasi Geometri (3D -> 2D)
            const cleanGeom = {
                type: plain.geom.type,
                coordinates: stripZ(plain.geom.coordinates)
            };

            // 3. URL Foto
            let photoLink = '';
            if (plain.attachments && plain.attachments.length > 0) {
                photoLink = `${baseUrl}${plain.attachments[0].fileUrl.startsWith('/') ? '' : '/'}${plain.attachments[0].fileUrl}`;
            }

            // 4. Build Properties
            let finalProperties = {};
            let htmlRows = '';

            definitions.forEach(def => {
                // a. Cari Data (Physical vs JSON)
                let rawValue;
                if (PHYSICAL_MAP[def.key]) {
                    rawValue = plain[PHYSICAL_MAP[def.key]];
                } else {
                    rawValue = plain.properties ? plain.properties[def.key] : null;
                }

                // b. Bersihkan Nilai
                const safeValue = cleanValue(rawValue);

                // c. Assign ke Output
                if (targetFormat === 'kml') {
                    if (def.is_visible_public !== false) {
                        htmlRows += `<tr><td style="background-color:#eee;"><b>${def.label}</b></td><td>${safeValue}</td></tr>`;
                    }
                    finalProperties[def.label] = safeValue;
                } else {
                    // SHP/GeoJSON: Gunakan Export Alias (Max 10 Char)
                    let outKey = def.export_alias;
                    if (!outKey) outKey = def.key.substring(0, 10).toUpperCase();
                    finalProperties[outKey] = safeValue;
                }
            });

            // 5. Output Construction
            if (targetFormat === 'kml') {
                if (photoLink) {
                    htmlRows += `<tr><td colspan="2"><img src="${photoLink}" width="300" /></td></tr>`;
                }
                const htmlDescription = `
                    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                        ${htmlRows}
                    </table>`;

                return {
                    type: "Feature",
                    properties: {
                        NAME: plain.name || 'No Name',
                        description: htmlDescription
                    },
                    geometry: cleanGeom
                };
            } else {
                // SHP & GeoJSON
                finalProperties['SYSTEM_ID'] = cleanValue(plain.id);
                finalProperties['FOTO'] = cleanValue(photoLink);

                return {
                    type: "Feature",
                    properties: finalProperties,
                    geometry: cleanGeom
                };
            }
        })
        .filter(f => f !== null); // Hapus data invalid

    if (geojsonFeatures.length === 0) throw new Error("Data ditemukan tapi geometri tidak valid.");

    const geojson = {
        type: "FeatureCollection",
        features: geojsonFeatures
    };

    const safeName = layer.name.replace(/[^a-zA-Z0-9]/g, '_');

    // --- STEP E: EXPORT EXECUTION ---
    if (targetFormat === 'kml') {
        const kmlString = tokml(geojson, {
            documentName: layer.name,
            name: 'NAME',
            description: 'description'
        });
        return {
            filename: `${safeName}.kml`,
            mimeType: 'application/vnd.google-earth.kml+xml',
            buffer: Buffer.from(kmlString)
        };
    }
    else if (targetFormat === 'geojson' || targetFormat === 'json') {
        return {
            filename: `${safeName}.geojson`,
            mimeType: 'application/geo+json',
            buffer: Buffer.from(JSON.stringify(geojson, null, 2))
        };
    }
    else {
        // --- SHP WRITE LOGIC (FIXED) ---
        try {
            // Mapshaper bekerja dengan menerima Input File (Virtual) dan Command String

            // A. Siapkan Virtual File
            // Kita beri nama 'input.json'
            const inputFiles = {
                'input.json': geojson // Mapshaper bisa baca Object JS langsung
            };

            // B. Siapkan Command
            // -i input.json : Input file
            // -o output.zip : Output langsung ke ZIP
            // format=shapefile : Format SHP
            // target=input.json : Target layer yang mau diproses

            // Tips: Anda bisa tambah 'snap' untuk memperbaiki gap, atau 'clean' untuk topology
            const cmd = `-i input.json -o ${safeName}.zip format=shapefile`;

            // C. Eksekusi
            const output = await mapshaper.applyCommands(cmd, inputFiles);

            // Output mapshaper adalah object berisi buffer file-file hasil
            // output['Jalan.zip']

            // Karena nama file output dinamis (safeName.zip), kita ambil value pertama dari object output
            const outputBuffer = Object.values(output)[0];

            return {
                filename: `${safeName}.zip`,
                mimeType: 'application/zip',
                buffer: outputBuffer
            };

        } catch (error) {
            console.error("Mapshaper Error:", error);
            // Mapshaper error message biasanya sangat jelas (misal: "Field name too long")
            throw new Error("Gagal convert SHP via Mapshaper: " + error.message);
        }
    }
};