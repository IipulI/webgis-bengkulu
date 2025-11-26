import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Role extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    Role.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
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

            tableName: "roles",
            modelName: "Role",
        }
    );

    return Role
}
