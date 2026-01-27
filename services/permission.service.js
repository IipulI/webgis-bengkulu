import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";
import slug from "slug";

const { Permission } = models;

export const getAll = async (page, size) => {
    try {
        let queryBuilder = {}
        const isPaginated = page !== null && size !== null;

        queryBuilder = {
            attributes: [
                'id',
                'name',
                'slug',
                'description',
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }

        if (isPaginated) {
            const { limit, offset } = getPagination(page, size);
            queryBuilder.limit = limit;
            queryBuilder.offset = offset;
        }

        const { count, rows} = await Permission.findAndCountAll(queryBuilder)

        return {
            count,
            rows: rows,
            isPaginated: isPaginated
        }

    } catch (error) {
        console.error(error);
        throw new InternalServerError(error.message);
    }
}

export const create = async (body) => {
    const permission = await Permission.findOne({
        where: {
            name: { [Op.iLike]: body.name }
        }
    })

    if (permission) {
        throw new ConflictError("Nama sudah ada tolong ganti nama lain")
    }

    const nameSlug = slug(body.name, '.')

    try {
        return await Permission.create({
            slug: nameSlug,
            name: body.name,
            description: body.description,
        })
    }
    catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

export const update = async (id, body) => {
    const permission = await Permission.findByPk(id)
    if (!permission) {
        throw new NotFoundError("Permission tidak ditemukan");
    }

    const nameSlug = slug(body.name, '.')

    const duplicateCheck = await Permission.findOne({
        where: {
            slug: { [Op.iLike]: nameSlug },
            id: { [Op.ne]: id }
        }
    })
    if (duplicateCheck) {
        throw new ConflictError("Nama sudah ada tolong ganti nama lain")
    }

    try {
        return await permission.update({
            slug: nameSlug,
            name: body.name,
            description: body.description,
        })
    }
    catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

export const deletePermission = async (id) => {
    const permission = await Permission.findByPk(id)
    if (!permission) {
        throw new NotFoundError("Permission tidak ditemukan");
    }

    try {
        await permission.destroy()
    }
    catch (error) {
        console.error(error);
        throw new Error(error);
    }
}