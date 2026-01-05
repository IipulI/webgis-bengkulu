import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class LayerSchema extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    LayerSchema.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            name: {
                type: DataTypes.STRING,
            },
            subCategory: {
                type: DataTypes.STRING,
                field: "sub_category",
                unique: true,
            },
            geometryType: {
                type: DataTypes.STRING,
                field: "geometry_type"
            },
            definition: {
                type: DataTypes.JSONB
            },
            description: {
                type: DataTypes.TEXT,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                field: "is_active"
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "layer_schemas",
            modelName: "LayerSchema"
        }
    );

    return LayerSchema;
}