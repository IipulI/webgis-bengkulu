import ResponseBuilder from "../utils/response.js";
import * as layerService from '../services/layer.service.js'
import { getPagingData } from "../utils/pagination.js";

export const getLayers = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await layerService.getLayer()

        responseBuilder
            .status('success')
            .code(200)
            .message('berhasil mengambil data')
            .json(data)
    }
    catch (error) {
        next(error);
    }
};

export const getDetailLayer = async (req, res, next) => {
    const { id } = req.params;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await layerService.getLayerDetailDashboard(id, page, size)

        let payload;
        if (data.isPaginated) {
            payload = getPagingData(data, page, size);

            if (Array.isArray(payload.items) && payload.items.length > 0) {
                payload.items = payload.items[0];
            }
        } else {
            payload = data.rows[0];
        }

        responseBuilder
            .status('success')
            .code(200)
            .message("berhasil mengambil data")
            .json(payload)
    }
    catch (error) {
        next(error);
    }
}

export const getLayerGeoJSON = async (req, res, next) => {
    const { id } = req.params;
    const user  = req.user;

    const isPublicUser = !user;

    try {
        const data = await layerService.getLayerDetail(id, isPublicUser)

        return res.json(data)
    }
    catch (error) {
        next(error)
    }
};

export const createLayer = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);
    const body = req.body;

    try {
        const data = await layerService.createNewLayer(body)

        responseBuilder
            .status('success')
            .code(201)
            .message('berhasil menyimpan data')
            .json(data)
    }
    catch (error) {
        next(error);
    }
}

export const updateLayer = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);
    const body = req.body;

    try {
        const data = await layerService.updateLayer(id, body)

        responseBuilder
            .status('success')
            .code(200)
            .message('berhasil merubah data')
            .json(data)
    }
    catch (error) {
        next(error);
    }
}

export const deleteLayer = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        await layerService.deleteLayer(id);

        responseBuilder
            .status('success')
            .code(200)
            .message('berhasil menghapus data')
            .json()
    }
    catch (error) {
        next(error);
    }
}

export const toggleLayerOnOff = async (req, res, next) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await layerService.toggleLayer(id);

        responseBuilder
            .status('success')
            .code(200)
            .message('berhasil menyimpan data')
            .json(data)
    }
    catch (error) {
        next(error);
    }
}