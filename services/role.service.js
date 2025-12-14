import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

const { User, Role } = models;

export const getAllRoles = async (page, size) => {
    try {
        let queryBuilder = {}
        const isPaginated = page !== null && size !== null;
        const now = new Date();

        queryBuilder = {
            attributes: [
                'id',
                'name',
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

        const { count, rows} = await Role.findAndCountAll(queryBuilder)

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

export const createRole = async (roleData) => {
    const role = await Role.findOne({
        where: {
            name: { [Op.like]: roleData.name }
        }
    })
    if (!role) {
        throw new ConflictError("Nama serupa sudah ada, tolong ganti nama")
    }

    try {
        return await Role.create({
            name: roleData.name,
            description: roleData.description,
        })
    }
    catch (error) {
        console.error(error)
        throw error
    }
}

export const updateRole = async (roleId, roleData) => {
    const role = await Role.findByPk(roleId)
    if (!role) {
        throw new NotFoundError("Role tidak ditemukan")
    }

    try{
        return await Role.update({
            name: role.name,
            description: role.description,
        })
    }
    catch (error) {
        console.error(error)
        throw error
    }
}

export const deleteRole = async (roleId) => {
    const role = await Role.findByPk(roleId)
    if (!role) {
        throw new NotFoundError("Role tidak ditemukan")
    }

    try {
        await role.destroy()
    }
    catch (error) {
        console.error()
        throw error
    }
}