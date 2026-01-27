import * as permissionService from '../services/permission.service.js';
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";

export const getAll = async (req, res, next) => {
    const page = req.query.page != null ? req.query.page : null;
    const size = req.query.size != null ? req.query.size : null;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await permissionService.getAll(page, size)

        let payload
        if (data.isPaginated){
            payload = getPagingData(data,page, size);
        } else {
            payload = data.rows
        }

        responseBuilder
            .status('success')
            .message("Berhasil mengambil data")
            .json(payload)
    }
    catch (error) {
        next(error)
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await permissionService.create(req.body)

        responseBuilder
            .status('success')
            .code(201)
            .message("Berhasil menyimpan data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const update = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const id = req.params.id;

    try {
        const data = await permissionService.update(id, req.body)

        responseBuilder
            .status('success')
            .message("Berhasil menyimpan data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const destroy = async (req, res, next) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res)

    try {
        await permissionService.deletePermission(id)

        responseBuilder
            .status('success')
            .message("Berhasil menghapus data")
            .json()
    }
    catch (error) {
        next(error)
    }
}