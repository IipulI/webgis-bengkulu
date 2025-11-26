import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Layer extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    Layer.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            name: {
                type: DataTypes.STRING,
            },
            description: {
                type: DataTypes.TEXT
            },
            geometryType: {
                type: DataTypes.STRING,
                field: "geometry_type"
            },
            color: {
                type: DataTypes.STRING
            },
            iconUrl: {
                type: DataTypes.TEXT,
                field: "icon_url"
            },
            isActive: {
                type: DataTypes.BOOLEAN,
            },
            metadata: {
                type: DataTypes.JSONB
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "layers",
            modelName: "Layer",
        }
    );

    return Layer
}
