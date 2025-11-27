import db from "../models/index.js";
import ResponseBuilder from "../utils/response.js";
import * as layerService from '../services/layer.service.js'

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

export const getLayerGeoJSON = async (req, res, next) => {
    const { id } = req.params;

    try {
        const data = await layerService.getLayerDetail(id)

        return res.json(data)
    }
    catch (error) {
        next(error)
    }
};