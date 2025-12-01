import fs from 'fs/promises';
import path from 'path';
import db from "../models/index.js";
import { NotFoundError } from "../utils/custom-error.js";

const { FeatureAttachment } = db;

export const addAttachment = async (layerId, featureId, file, description) => {
    const relativePath = file.path.replace(/\\/g, '/');
    const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    return await FeatureAttachment.create({
        layerId,
        featureId,
        originalName: file.originalname,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        description: description
    });
};

export const getAttachmentsByFeature = async (layerId, featureId) => {
    return await FeatureAttachment.findAll({
        where: { layerId, featureId },
        order: [['created_at', 'DESC']]
    });
};

export const deleteAttachment = async (attachmentId) => {
    const attachment = await FeatureAttachment.findByPk(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment tidak ditemukan");

    try {
        const cleanPath = attachment.fileUrl.startsWith('/') ? attachment.fileUrl.substring(1) : attachment.fileUrl;

        const absolutePath = path.join(process.cwd(), cleanPath);

        await fs.unlink(absolutePath);
        console.log(`File fisik dihapus: ${absolutePath}`);
    } catch (err) {
        console.warn(`Gagal menghapus file fisik (mungkin sudah hilang): ${err.message}`);
    }
    await attachment.destroy();
};