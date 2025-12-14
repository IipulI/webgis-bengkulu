import { generateUUIDv7 } from '../utils/uuidv7-generator.js';

export const getUuidList = (req, res) => {
    try {
        const COUNT = req.query.count !== null ? parseInt(req.query.count) : 1;
        const INTERVAL_MS = 1000; // 1 detik
        const START_TIME = Date.now();

        // 1. Inisialisasi Array
        const uuidList = [];

        // 2. Loop untuk generate dan push ke array
        for (let i = 0; i < COUNT; i++) {
            const currentTimestamp = START_TIME + (i * INTERVAL_MS);
            const uuid = generateUUIDv7(currentTimestamp);

            uuidList.push(uuid);
        }

        // Opsi A: Polos (Satu per baris) -> Cocok untuk copy ke Excel/Text Editor
        // Hasil:
        // uuid1
        // uuid2
        const plainText = uuidList.join('\n');

        // Opsi B: Dengan Koma (SQL Friendly) -> Cocok untuk klausa "IN (...)"
        // Hasil:
        // 'uuid1',
        // 'uuid2',
        // const sqlStyle = uuidList.map(u => `'${u}',`).join('\n');

        // 2. Set Header agar browser membacanya sebagai text biasa
        res.type('text/plain');

        // 3. Kirim string
        return res.send(plainText);

    } catch (error) {
        console.error('Error generating UUIDs:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};


export const formatter = async(req, res) => {
    const rawData = [
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Teluk Segara","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":741.995495102,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Jitra","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":170.76680657,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Sekretariat Forum Komunikasi RT/RW","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":287.4660463,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Sumur Meleleh","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":115.975332502,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":383.436519918,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":517.372073389,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":123.421546547,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Kebun Roos","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":222.497420844,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Kebun keling","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":91.3239999063,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pengawasan Ketenagakerjaan Wilayah I dan II *","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":599.250503343,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Kesehatan Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":454.446026716,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Inspektorat Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":383.485236355,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Anggut Atas","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":118.120049868,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"DPD APDESI Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":230.368188696,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"KPPN Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":516.33633587,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"KPPN Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":294.450350738,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"KPPN Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":741.873985977,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Unit Kerja Pengadaan Barang/Jasa (UKPBJ)","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":1767.81343002,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Ratu Samban","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":574.265552119,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Perpustakaan Dan Kearsipan Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":1308.6394934,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Sanggar Kegiatan Belajar Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":369.618309078,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Badan Kesatuan Bangsa Dan Politik","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":832.984194731,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Badan Kesatuan Bangsa Dan Politik","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":164.598749795,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Badan Kesatuan Bangsa Dan Politik","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":262.768927622,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Badan Kesatuan Bangsa Dan Politik","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":491.323222936,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":210.294683493,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":42.0026004206,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Kampung Bali","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":169.55555613,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Pimpinan Wilayah 'Aisyiyah Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":159.262333161,"nomorRegister":"1.3.3.01.001.001.001","tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Tengah Padang","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":203.072917738,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Sekretariat Forum Kelurahan Sehat Kelurahan Bajak","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":46.0985744547,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan pondok besi","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":62.5657402886,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD SPAM Regional Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":289.136371892,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Bengkulu Command Center","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":204.799020459,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Malabro","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":141.7539451,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"PMI Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":303.482485498,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Pokmaswas Baracuda Desa Malabro","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":144.842121711,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Berkas","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":106.465083718,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Pasar Baru","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":192.360857526,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Pasar Melintang","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":87.1280175975,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Pariwisata Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":136.346542593,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Pintu Batu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":188.104795865,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Anggut Dalam","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":70.0479929992,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"KPPN Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":168.047258645,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Kebun Geran","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":140.294755893,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Anggut Bawah","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":172.984091285,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"KUA Kecamatan Ratu Samban","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":173.018274139,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"PMI Kota Bengkuku","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":253.654662714,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Penurunan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":280.684902657,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Padang Jati","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":222.39127302,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Pendidikan dan Kebudayaan Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":754.306839182,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Kominfo Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":146.897890839,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Pengantungan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":95.2434022469,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Lempuing","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":152.023581884,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Tanah Patah","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":145.564406519,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Farmasi Dinkes Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":653.864866155,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Koperasi dan UKM Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":156.154982217,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Kebun Kenanga","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":76.1977726109,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Kebun Beler","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":103.281780194,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Nusa Indah","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":198.71731471,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Sawah Lebar","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":175.272183166,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Sawah Lebar Baru","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":141.065247799,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":564.607937519,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":425.77480638,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":126.854366484,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":140.491466479,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":131.653407009,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":57.2357260179,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":240.483493767,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":331.311584589,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Panorama","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":135.284605646,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":519.190062867,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":393.668266966,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":186.796974204,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":177.337999087,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":370.251657158,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Pelatiha Kerja Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":62.0127049823,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Jembatan Kecil","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":204.727130682,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":52.830340385,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Dinas Kelautan dan Perikanan Kota Bangkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":30.7888192202,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Kelurahan Belakang Pondok","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":95.6611184179,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Institusi Karate-do Nasional","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":173.904235353,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Sosial Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":278.180212313,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Damkar Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":122.37994217,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Damkar Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":12.1214504009,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Damkar Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":136.718897244,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Damkar Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":738.674329573,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Padang Harapan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":144.497235484,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Laboratorium Kesehatan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":67.5726097559,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Laboratorium Kesehatan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":19.8698854275,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Lingkar Barat","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":169.784716856,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Gading Cempaka","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":67.1799680071,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Gading Cempaka","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":214.643997881,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Gading Cempaka","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":868.484204393,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Jalan Gedang","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":250.687075967,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Cempaka Permai","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":168.546143039,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Cempaka Permai","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":123.502928492,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Puskesmas Lingkar Timur","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":146.783519435,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Puskesmas Lingkar Timur","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":132.14711051,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Puskesmas Lingkar Timur","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":159.168885062,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Padang Nangka","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":243.512037073,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Padang Nangka","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":215.890547165,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Dusun Besar","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":165.007615627,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":33.0250387531,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":46.9340836983,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":36.3972574214,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":48.36178233,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":329.213633438,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Balai Penjaminan Mutu Pendidikan Provinsi Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":549.21957854,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Timur Indah","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":164.579858664,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Sidomulyo","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":282.55753811,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Dinas Perindustrian Dan Perdagangan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":117.488969889,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Dinas Perindustrian Dan Perdagangan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":271.24195856,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Dinas Perindustrian Dan Perdagangan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":1758.10371985,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"UPTD Dinas Perindustrian Dan Perdagangan","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":157.406084191,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Lurah Lingkar Timur","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":186.718327731,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Lingkungan Hidup Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":51.910173449,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Lingkungan Hidup Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":96.6250748926,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Lingkungan Hidup Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":128.480688694,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Lingkungan Hidup Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":88.3183826659,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Kantor Camat Singaran Pati","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":487.132696049,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"DPMPTSP Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":110.641178686,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"DPMPTSP Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":1322.90061988,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"DPMPTSP Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":78.5280510066,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"DPMPTSP Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":305.884936263,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Tenaga Kerja Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":378.809437962,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Tenaga Kerja Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":45.66011374,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null},
        {"type":"Bangunan Gedung","namaBangunan":"Dinas Tenaga Kerja Kota Bengkulu","lokasi":null,"jenisBangunan":"Bangunan Perkantoran","luasBangunan":225.336525878,"nomorRegister":null,"tahunPengadaan":2020,"tahunPerbaikanTerakhir":null}
    ];

    const result = rawData.map((item, index) => {
        const jsonString = JSON.stringify(item);

        return `"${jsonString.replace(/"/g, '""')}"`;
    });

    res.json(result.join('\n'));
}