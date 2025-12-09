import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";
import bcrypt from "bcryptjs";

export default (sequelize) => {
    class User extends Model {
        static associate(models) {
            this.belongsTo(models.Role, {
                foreignKey: "role_id",
                as: "role",
            })
        }
    }

    User.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            roleId: {
                type: DataTypes.UUID,
                field: "role_id",
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            fullName: {
                type: DataTypes.STRING,
                allowNull: false,
                field: "full_name",
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            }
        },
        {
            hooks: {
                beforeCreate: async(user) => {
                    if(user.password) {
                        const salt = await bcrypt.genSalt(12);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                }
            },

            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "users",
            modelName: "User",
        }
    );

    return User
}
