import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Permission extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    Permission.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            slug: {
                type: DataTypes.STRING
            },
            name: {
                type: DataTypes.STRING
            },
            description: {
                type: DataTypes.TEXT
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "permissions",
            modelName: "Permission",
        }
    );

    return Permission
}
