import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Layer extends Model {
        static associate(models) {
            this.hasMany(models.SpatialLine, {
                foreignKey: 'layer_id',
                as: 'spatialLine'
            })

            this.hasMany(models.SpatialPoint, {
                foreignKey: 'layer_id',
                as: 'spatialPoint'
            })

            this.hasMany(models.SpatialPolygon, {
                foreignKey: 'layer_id',
                as: 'spatialPolygon'
            })
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
            category:{
                type: DataTypes.STRING
            },
            subCategory: {
                type: DataTypes.STRING,
                field: "sub_category"
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
