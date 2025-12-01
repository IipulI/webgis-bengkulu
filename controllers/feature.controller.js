import * as featureService from '../services/feature.service.js';
import ResponseBuilder from "../utils/response.js";

// export const getAllFeatureByLayer = async (req, res, next) => {
//     const layerId = req.params.layerId;
//     const responseBuilder = new ResponseBuilder(res)
//
//     try {
//         const data = await featureService.getAllSpatialFeatureByLayer(layerId);
//
//         responseBuilder
//             .status('success')
//             .code(200)
//             .message("Berhasil mengambil data spasial")
//             .json(data)
//     }
//     catch (error) {
//         next(error);
//     }
// }

export const getOneFeature = async (req, res, next) => {
    const layerId = req.params.layerId;
    const featureId = req.params.featureId;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await featureService.getOneSpatialFeature(layerId, featureId);

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengambil data spasial")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const createFeature = async(req, res, next) => {
    const id = req.params.layerId
    const responseBuilder = new ResponseBuilder(res)

    try{
        const data = await featureService.addSpatialFeatures(id, req.body)

        responseBuilder
            .status('success')
            .code(201)
            .message("Berhasil menambahkan data spasial")
            .json(data)
    }
    catch(error){
        next(error)
    }
}

export const updateFeature = async(req, res, next) => {
    const layerId = req.params.layerId;
    const featureId= req.params.featureId;
    const responseBuilder = new ResponseBuilder(res);

    try{
        const data = await featureService.updateSpatialFeatures(layerId, featureId, req.body)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil mengubah data spasial")
            .json(data)
    }
    catch(error){
        next(error)
    }
}

export const deleteFeature = async(req, res, next) => {
    const layerId = req.params.layerId;
    const featureId= req.params.featureId;
    const responseBuilder = new ResponseBuilder(res);

    try {
        await featureService.removeSpatialFeatures(layerId, featureId)

        responseBuilder
            .status('success')
            .code(200)
            .message("Berhasil menghapus data spasial")
            .json()
    }
    catch(error){
        next(error)
    }
}