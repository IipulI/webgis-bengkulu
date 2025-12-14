import * as roleService from "../services/role.service.js";
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";

export const getAll = async (req, res, next) => {
    const page = req.query.page != null ? req.query.page : null;
    const size = req.query.size != null ? req.query.size : null;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await roleService.getAllRoles(page, size)

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

    try{
        const data = await roleService.createRole(req.body)

        responseBuilder
            .code(201)
            .message("Berhasil menyimpan data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const update = async (req, res, next) => {
    const roleId = req.params.id
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await roleService.updateRole(roleId, req.body)

        responseBuilder
            .message("Berhasil menyimpan data")
            .json(data)
    }
    catch (error) {
        next(error)
    }
}

export const deleteRole = async (req, res, next) => {
    const roleId = req.params.id
    const responseBuilder = new ResponseBuilder(res)

    try {
        await roleService.deleteRole(roleId)

        responseBuilder
            .message("Berhasil menghapus data")
            .json()
    }
    catch (error) {
        next(error)
    }
}