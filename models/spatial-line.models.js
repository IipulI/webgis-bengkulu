import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class SpatialLine extends Model {
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

    SpatialLine.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            layerId: {
                type: DataTypes.UUID,
                field: "layer_id",
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            properties: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            geom: {
                type: DataTypes.GEOMETRY('MULTILINESTRINGZ', 4326),
                allowNull: false,
            },
            yearBuilt: {
                type: DataTypes.STRING,
                field:"year_built"
            },
            regNumber: {
                type: DataTypes.STRING,
                field:"reg_number"
            },
            assetCode: {
                type: DataTypes.STRING,
                field:"asset_code"
            },
            condition: {
                type: DataTypes.STRING,
            },
            managedBy: {
                type: DataTypes.STRING,
                field:"managed_by"
            },
            dataSource: {
                type: DataTypes.STRING,
                field:"data_source"
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

            tableName: "spatial_lines",
            modelName: "SpatialLine",
        }
    );

    return SpatialLine
}
