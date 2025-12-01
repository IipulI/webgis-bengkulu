import * as attachmentService from '../services/attachment.service.js';
import { BadRequestError } from '../utils/custom-error.js';
import ResponseBuilder from "../utils/response.js";

export const uploadAttachment = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const { layerId, featureId } = req.params;
        const { description } = req.body;

        const files = req.files['file'];

        if (!files || files.length === 0) {
            throw new BadRequestError("File wajib diupload");
        }

        const file = files[0];

        const data = await attachmentService.addAttachment(layerId, featureId, file, description);

        responseBuilder
            .status('success')
            .code(201)
            .message("file berhasil diunggah")
            .json(data)

    } catch (error) {
        next(error);
    }
};

export const getAttachments = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const { layerId, featureId } = req.params;
        const data = await attachmentService.getAttachmentsByFeature(layerId, featureId);

        responseBuilder
            .status('success')
            .code(201)
            .message("berhasil menggambil data file")
            .json(data)
    } catch (error) {
        next(error);
    }
};

export const removeAttachment = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const { id } = req.params; // ID Attachment
        await attachmentService.deleteAttachment(id);

        responseBuilder
            .status('success')
            .code(200)
            .message("file berhasil dihapus")
            .json()
    } catch (error) {
        next(error);
    }
};