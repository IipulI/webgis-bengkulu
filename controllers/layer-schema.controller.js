import * as layerSchemaService from "../services/layer-schema.service.js"
import { getPagingData } from "../utils/pagination.js";
import ResponseBuilder from "../utils/response.js";

export const getAllLayerSchemas = async (req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await layerSchemaService.getAllLayerSchema(page, size);

        let payload;
        if(data.isPaginated) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        responseBuilder.status("success")
            .code(200)
            .message("Berhasil mengambil data")
            .json(payload)
    }
    catch (error) {
        next(error);
    }
}

export const getOneLayerSchema = async (req, res, next) => {
    const schemaId = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    console.log(schemaId)

    try {
        const data = await layerSchemaService.getOneLayerSchema(schemaId);

        responseBuilder.status("success")
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        next(error);
    }
}

export const createLayerSchema = async (req, res, next) => {
    try {
        const data = await layerSchemaService.createNewLayerSchema(req.body);

        new ResponseBuilder(res)
            .status("success")
            .code(201)
            .message("Berhasil membuat data")
            .json(data)
    }
    catch (error) {
        next(error);
    }
}

export const updateLayerSchema = async (req, res, next) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await layerSchemaService.updateLayerSchema(id, req.body)

        responseBuilder.status("success")
            .code(200)
            .message("Berhasil mengubah data")
            .json(data)
    }
    catch (error) {
        next(error);
    }
}

export const deleteLayerSchema = async (req, res, next) => {
    try {
        await layerSchemaService.deleteSchemaLayer(req.params.id);

        new ResponseBuilder(res)
            .status("success")
            .code(200)
            .message("Berhasil menghapus data")
            .json()
    }
    catch (error) {
        next(error);
    }
}