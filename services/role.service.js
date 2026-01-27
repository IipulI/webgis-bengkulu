import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, InternalServerError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";

const { Role, RolePermission, Permission } = models;

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

export const getOneRole = async (id) => {
    const role = await Role.findByPk(id, {
        include: {
            // attributes: ['id', 'roleId', 'permissionId'],
            model: RolePermission,
            as: "rolePermission",
            required: false,
            include: {
                // attributes: ['id', 'name', 'slug'],
                model: Permission,
                as: "permission",
                required: false
            }
        }
    })

    if (!role) {
        throw new NotFoundError("Role tidak ditemukan");
    }

    // 2. Convert Sequelize Instance to Plain JSON
    const roleData = role.toJSON();

    // 3. Map/Transform the data
    return {
        ...roleData, // Copy top-level fields (id, name, description, etc.)
        rolePermission: roleData.rolePermission.map(rp => ({
            roleId: rp.roleId,
            permissionId: rp.permissionId,
            slug: rp.permission?.slug,
            name: rp.permission?.name,
            description: rp.permission?.description
        }))
    };
}

export const createRole = async (roleData) => {
    const role = await Role.findOne({
        where: {
            name: { [Op.iLike]: roleData.name }
        }
    })
    if (role) {
        throw new ConflictError("Nama serupa sudah ada, tolong ganti nama")
    }

    try {
        return await sequelize.transaction(async (trx) => {
            const newRole = await Role.create({
                name: roleData.name,
                description: roleData.description,
            }, { transaction: trx });

            if (roleData.permissions && roleData.permissions.length > 0) {
                const rolePermissionsData = roleData.permissions.map((permissionId) => ({
                    roleId: newRole.id,
                    permissionId: permissionId
                }));

                // Bulk Create the RolePermissions
                await RolePermission.bulkCreate(rolePermissionsData, { transaction: trx });
            }

            return newRole;
        })
    }
    catch (error) {
        console.error(error)
        throw error
    }
}

export const updateRole = async (roleId, roleData) => {
    // 1. Check if the role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
        throw new NotFoundError("Role tidak ditemukan");
    }

    // If user changes name to "Admin" but "Admin" already exists on another ID
    const duplicateCheck = await Role.findOne({
        where: {
            name: { [Op.like]: roleData.name },
            id: { [Op.ne]: roleId }
        }
    });

    if (duplicateCheck) {
        throw new ConflictError("Nama role sudah digunakan, harap pilih nama lain");
    }

    try {
        return await sequelize.transaction(async (trx) => {
            // 3. Update basic Role info
            await role.update({
                name: roleData.name,
                description: roleData.description
            }, { transaction: trx });

            // 4. Handle Permission Sync
            if (roleData.permissions) {
                // A. Get all current permission IDs for this role from DB
                const currentPermissions = await RolePermission.findAll({
                    where: { roleId: roleId },
                    attributes: ['permissionId'],
                    transaction: trx
                });

                const currentIds = currentPermissions.map(rp => rp.permissionId);
                const newIds = roleData.permissions; // The array from request body

                // B. Calculate what to DELETE (In DB but NOT in Request)
                const toDelete = currentIds.filter(id => !newIds.includes(id));

                // C. Calculate what to CREATE (In Request but NOT in DB)
                const toCreate = newIds.filter(id => !currentIds.includes(id));

                // D. Execute Delete
                if (toDelete.length > 0) {
                    await RolePermission.destroy({
                        where: {
                            roleId: roleId,
                            permissionId: toDelete
                        },
                        transaction: trx
                    });
                }

                // E. Execute Create
                if (toCreate.length > 0) {
                    const payload = toCreate.map(permissionId => ({
                        roleId: roleId,
                        permissionId: permissionId
                    }));

                    await RolePermission.bulkCreate(payload, { transaction: trx });
                }
            }

            // 5. Return the updated role (fetching fresh data to show result)
            return await Role.findByPk(roleId, {
                include: {
                    model: RolePermission,
                    as: "rolePermission",
                    include: ["permission"]
                },
                transaction: trx
            });
        });
    } catch (error) {
        console.error(error);
        throw error;
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