import * as userService from '../services/user.service.js';
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";

export const getAllUsers = async(req, res, next) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await userService.getAllUsers(page, size);

        let payload;
        if(data.isPaginated) {
            payload = getPagingData(data, page, size)
        }
        else {
            payload = data.rows
        }

        responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil mengambil data")
            .json(payload);
    }
    catch(err) {
        next(err);
    }
}

export const getOneUser = async(req, res, next) => {
    const userId = req.params.id;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await userService.getOneUser(userId);

        responseBuilder.status("success")
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch(err) {
        next(err);
    }
}

export const createUser = async (req, res, next) => {
    try {
        const data = await userService.createUser(req.body);

        new ResponseBuilder(res)
            .status("success")
            .code(201)
            .message("Berhasil membuat data")
            .json(data)
    }
    catch(err) {
        next(err);
    }
}

export const updateUser = async (req, res, next) => {
    const userId = req.params.id;
    const responseBuilder = new ResponseBuilder(res)

    try {
        const data = await userService.updateUser(userId, req.body);

        responseBuilder.status("success")
            .code(200)
            .message("Berhasil mengubah data")
            .json(data)
    }
    catch(err) {
        next(err);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id);

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