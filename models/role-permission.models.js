import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
    class RolePermission extends Model {
        static associate(models) {
        }
    }

    RolePermission.init(
        {
            roleId: {
                type: DataTypes.UUID,
                field: "role_id",
                primaryKey: true,
                references: {
                    model: 'roles',
                    key: 'id'
                }
            },
            permissionId: {
                type: DataTypes.UUID,
                field: "permission_id",
                primaryKey: true,
                references: {
                    model: 'permissions',
                    key: 'id'
                }
            },
        },
        {
            sequelize,
            tableName: "role_permissions",
            modelName: "RolePermission",

            underscored: true,

            timestamps: true,
            updatedAt: false,
            paranoid: false,
        }
    );

    return RolePermission;
}