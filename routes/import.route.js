import express from 'express';
import { createUploadMiddleware, createRequiredFieldsValidator } from '../middleware/upload.middleware.js';
import { createLayerImport, importLayerData } from '../controllers/import.controller.js';

const router = express.Router();

// 1. Config Upload (Hanya ZIP)
const zipUploadConfig = [{
    name: 'file',
    maxCount: 1,
    destination: 'temp_imports', // Folder sementara
    allowedMimeTypes: [
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream', // Kadang zip terdeteksi sbg octet-stream
        'multipart/x-zip'
    ],
    maxSize: 100 * 1024 * 1024 // 100MB Max
}];

const uploadZip = createUploadMiddleware(zipUploadConfig);
const requireZip = createRequiredFieldsValidator(['file']);

router.post(
    '/imports',
    uploadZip,
    requireZip,
    createLayerImport
);

router.post(
    '/:id/imports',
    uploadZip,
    requireZip,
    importLayerData
);

export default router;