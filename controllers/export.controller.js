import * as exportService from '../services/export.service.js';

export const downloadLayerShp = async (req, res, next) => {
    try {
        const { id } = req.params;
        const format = req.query.format || 'shp';

        const { filename, buffer } = await exportService.exportLayerData(id, format);

        // Header agar browser tahu ini file download
        const fileBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        // Kirim binary data
        res.send(buffer);

    } catch (error) {
        next(error);
    }
};