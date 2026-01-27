import models from '../models/index.js'
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";

const { User, Role } = models

export const getAllUsers = async(page, size) => {
    const isPaginated = page != null && size != null;

    const queryBuilder = {
        attributes: ['id', 'fullName', 'username', 'email', 'roleId'],
        include: {
            attributes: [
                'id', 'name', 'description'
            ],
            model: Role,
            as: 'role'
        },
        order: [['createdAt', 'DESC']],
    }

    if (isPaginated){
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;
    }

    try {
        const { count, rows } = await User.findAndCountAll(queryBuilder)

        return {
            count,
            rows,
            isPaginated
        }
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message)
    }
}

export const getOneUser = async(id) => {
    const user = await User.findOne({
        attributes: ['id', 'fullName', 'username', 'email', 'roleId'],
        include: {
            attributes: [
                'id', 'name', 'description'
            ],
            model: Role,
            as: 'role'
        },
        where: {
            id: id
        }
    })

    if (!user) {
        throw new NotFoundError("User tidak ditemukan")
    }

    return user;
}

export const createUser = async(body) => {
    const userExist = await User.findOne({
        where: {
            [Op.or] : [
                { username : body.username },
                { email : body.email },
            ]
        }
    })

    if (userExist) {
        throw new ConflictError("Username atau email sudah ada, silahkan gunakan yang lain")
    }

    const staffRole = await Role.findOne({
        where: {
            id: body.roleId
        }
    })
    if (!staffRole) {
        throw new NotFoundError("Role tidak ditemukan")
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    try {
        const data =  await User.create({
            username: body.username,
            fullName: body.fullName,
            email: body.email,
            password: hashedPassword,
            roleId: staffRole.id
        })

        return {
            id: data.id,
            username: data.username,
            fullName: data.fullName,
            email: data.email,
            role: staffRole.name,
            createdAt: staffRole.createdAt,
            updatedAt: staffRole.updatedAt,
        }
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message)
    }
}

export const updateUser = async(userId, body) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'fullName', 'username', 'email', 'roleId'],
    })

    if (!user) {
        throw new NotFoundError("User tidak ditemukan")
    }

    try {
        return await user.update({
            username: body.username,
            fullName: body.fullName,
            email: body.email,
        })
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message)
    }
}

export const deleteUser = async(userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id']
    })
    if (!user) {
        throw new NotFoundError("User tidak ditemukan")
    }

    try {
        await user.destroy()
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message)
    }
}

export const resetPassword = async(userId, password) => {
    const user = await User.findByPk(userId)
    if (!user) {
        throw new NotFoundError("User tidak ditemukan")
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        await user.update({
            password: hashedPassword,
        })
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message)
    }
}