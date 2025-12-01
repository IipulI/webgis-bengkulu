import express from 'express';
import { createUploadMiddleware, createRequiredFieldsValidator } from '../middleware/upload.middleware.js';
import { uploadAttachment, getAttachments, removeAttachment } from '../controllers/attachment.controller.js';

const router = express.Router();

const spatialAttachmentConfig = [
    {
        name: 'file',
        maxCount: 1,
        destination: 'spatial-attachments',
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
        maxSize: 10 * 1024 * 1024
    }
];

const uploadMiddleware = createUploadMiddleware(spatialAttachmentConfig);
const validateFile = createRequiredFieldsValidator(['file']);

router.get('/:layerId/:featureId', getAttachments);

router.post(
    '/:layerId/:featureId',
    uploadMiddleware, // 1. Handle Fisik File
    validateFile,     // 2. Validasi Wajib Ada
    uploadAttachment  // 3. Logic Database
);

// DELETE: Hapus attachment berdasarkan ID-nya
router.delete('/:id', removeAttachment);

export default router;