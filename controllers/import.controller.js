import * as importService from '../services/import.service.js';
import { BadRequestError } from '../utils/custom-error.js';

export const importLayerData = async (req, res, next) => {
    try {
        const { layerId } = req.params;

        // Ambil file dari req.files (karena middleware Anda pakai .fields())
        const files = req.files['file'];

        if (!files || files.length === 0) {
            throw new BadRequestError("File ZIP Shapefile wajib diupload");
        }

        const file = files[0];

        // Panggil Service
        const result = await importService.importShapefileBulk(layerId, file.path);

        res.status(200).json({
            status: 'success',
            message: 'Proses import selesai',
            data: result
        });

    } catch (error) {
        next(error);
    }
};

export const createLayerImport = async (req, res, next) => {
    try {
        // Sesuaikan dengan config Anda (req.files['file'][0] atau req.file)
        const files = req.files['file'];
        if (!files || files.length === 0) {
            throw new BadRequestError("File ZIP wajib diupload");
        }

        const file = files[0];

        // req.body bisa berisi: { name: "Nama Layer", description: "...", color: "#ff0000" }
        const result = await importService.createLayerFromZip(file, req.body);

        res.status(201).json({
            status: 'success',
            message: 'Layer baru berhasil dibuat dan data diimport',
            data: result
        });

    } catch (error) {
        next(error);
    }
};