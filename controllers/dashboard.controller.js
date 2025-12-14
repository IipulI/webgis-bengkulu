import ResponseBuilder from "../utils/response.js";
import * as featureService from "../services/feature.service.js";

export const getAssetStatistic = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await featureService.getAssetsByCategory();

        responseBuilder
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}