import db from "../models/index.js";
import shpwrite from '@mapbox/shp-write';
import tokml from 'tokml';

const { Layer, SpatialPoint, SpatialLine, SpatialPolygon, FeatureAttachment } = db;

/**
 * Service untuk Export Layer ke format SHP, KML, atau GeoJSON
 * @param {string} layerId - UUID Layer
 * @param {string} format - 'shp', 'kml', 'geojson'
 */
export const exportLayerData = async (layerId, format = 'shp') => {
    // 1. Cek Layer & Tentukan Model Target
    const layer = await Layer.findByPk(layerId);
    if (!layer) throw new Error("Layer tidak ditemukan");

    let TargetModel;
    if (layer.geometryType === 'POINT') TargetModel = SpatialPoint;
    else if (layer.geometryType === 'LINE') TargetModel = SpatialLine;
    else if (layer.geometryType === 'POLYGON') TargetModel = SpatialPolygon;

    // 2. Ambil Data dari Database (Termasuk 1 Foto terbaru)
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
        // Ambil kolom-kolom penting
        attributes: ['id', 'name', 'geom', 'properties', 'yearBuilt', 'condition', 'regNumber', 'assetCode', 'managedBy', 'dataSource']
    });

    if (features.length === 0) throw new Error("Layer ini kosong, tidak ada data untuk diexport.");

    // 3. Mapping & Flattening Data ke format GeoJSON Standard
    const geojsonFeatures = features.map(item => {
        const plain = item.toJSON();

        // --- A. Logic Attachment URL ---
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        let photoLink = '';
        if (plain.attachments && plain.attachments.length > 0) {
            // Pastikan tidak ada double slash jika fileUrl sudah ada '/'
            photoLink = `${baseUrl}${plain.attachments[0].fileUrl.startsWith('/') ? '' : '/'}${plain.attachments[0].fileUrl}`;
        }

        // --- B. Logic HTML Description (Khusus KML) ---
        // Membuat tabel HTML agar tampilan popup di Google Earth rapi
        const propsKeys = Object.keys(plain.properties || {});
        let htmlDescription = `
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <tr><td style="background-color:#eee;"><b>Kondisi</b></td><td>${plain.condition || '-'}</td></tr>
                <tr><td style="background-color:#eee;"><b>Tahun</b></td><td>${plain.yearBuilt || '-'}</td></tr>
                <tr><td style="background-color:#eee;"><b>Pemilik</b></td><td>${plain.managedBy || '-'}</td></tr>
                <tr><td style="background-color:#eee;"><b>No. Reg</b></td><td>${plain.regNumber || '-'}</td></tr>
        `;

        // Loop dynamic properties dari JSONB
        propsKeys.forEach(key => {
            htmlDescription += `<tr><td style="background-color:#eee;"><b>${key}</b></td><td>${plain.properties[key]}</td></tr>`;
        });

        // Tambahkan Gambar di bawah tabel jika ada
        if (photoLink) {
            htmlDescription += `
                <tr><td colspan="2" style="text-align:center; padding:10px;">
                    <img src="${photoLink}" width="300" style="border:1px solid #ccc; padding:2px;" /><br/>
                    <small><a href="${photoLink}">Lihat Ukuran Penuh</a></small>
                </td></tr>
            `;
        }
        htmlDescription += `</table>`;

        // --- C. Menyusun Attributes (Properties) ---
        const attributes = {
            // SYSTEM ID (Sangat Penting untuk Import/Update Round-Trip)
            system_id: plain.id,

            // Atribut Standar
            NAME: plain.name ? plain.name.substring(0, 254) : 'No Name',
            TAHUN: plain.yearBuilt || 0,
            KONDISI: plain.condition || '',
            NO_REG: plain.regNumber || '',
            KODE: plain.assetCode || '',
            PEMILIK: plain.managedBy || '',
            SUMBER: plain.dataSource || '',

            // Link Foto (Untuk SHP/GeoJSON user bisa copas)
            LINK_FOTO: photoLink,

            // Konten HTML (Khusus untuk KML Description)
            HTML_CONTENT: htmlDescription,

            // Spread sisa properties JSONB agar jadi kolom fisik di SHP
            ...plain.properties
        };

        return {
            type: "Feature",
            properties: attributes,
            geometry: plain.geom
        };
    });

    // Bungkus dalam FeatureCollection
    const geojson = {
        type: "FeatureCollection",
        features: geojsonFeatures
    };

    // Bersihkan nama file dari karakter aneh
    const safeName = layer.name.replace(/[^a-zA-Z0-9]/g, '_');
    const targetFormat = format.toLowerCase();

    // 4. SWITCH FORMAT OUTPUT

    // === OPSI 1: KML (Google Earth) ===
    if (targetFormat === 'kml') {
        const kmlString = tokml(geojson, {
            documentName: layer.name,
            name: 'NAME',           // Kolom 'NAME' jadi Label di Peta
            description: 'HTML_CONTENT' // Kolom 'HTML_CONTENT' jadi Isi Popup
        });

        return {
            filename: `${safeName}.kml`,
            mimeType: 'application/vnd.google-earth.kml+xml',
            buffer: Buffer.from(kmlString) // String XML ke Buffer
        };
    }

    // === OPSI 2: GEOJSON (Developer/Web) ===
    else if (targetFormat === 'geojson' || targetFormat === 'json') {
        return {
            filename: `${safeName}.geojson`,
            mimeType: 'application/geo+json',
            buffer: Buffer.from(JSON.stringify(geojson, null, 2))
        };
    }

    // === OPSI 3: SHAPEFILE ZIP (GIS Desktop - Default) ===
    else {
        const options = {
            folder: safeName,
            types: {
                POINT: 'Point',
                POLYGON: 'Polygon',
                LINE: 'PolyLine'
            }
        };

        // shpwrite mengembalikan Promise berisi Base64 String
        const base64String = await shpwrite.zip(geojson, options);

        // Konversi Base64 ke Binary Buffer agar content-length valid
        return {
            filename: `${safeName}.zip`,
            mimeType: 'application/zip',
            buffer: Buffer.from(base64String, 'base64')
        };
    }
};