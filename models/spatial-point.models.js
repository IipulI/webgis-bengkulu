import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class SpatialPoint extends Model {
        static associate(models) {
            this.hasMany(models.FeatureAttachment, {
                foreignKey: "feature_id",
                sourceKey: "id",
                as: "attachments",
                constraints: false
            })

            this.belongsTo(models.Layer, { foreignKey: 'layer_id', as: 'layer' });
        }
    }

    SpatialPoint.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            layerId: {
                type: DataTypes.UUID,
                field: "layer_id",
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            properties: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            geom: {
                type: DataTypes.GEOMETRY('POINTZ', 4326),
                allowNull: false
            },
            createdBy: {
                type: DataTypes.UUID,
                field: "created_by",
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "spatial_points",
            modelName: "SpatialPoint",
        }
    );

    return SpatialPoint
}
