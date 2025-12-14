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
            importHash: {
                type: DataTypes.STRING,
                field: 'import_hash'
            },
            createdBy: {
                type: DataTypes.UUID,
                field: "created_by",
            },
        },
        {
            hooks: {
                // Hook ini jalan OTOMATIS sebelum data disimpan (baik via create atau bulkCreate)
                beforeSave: (instance) => {
                    if (instance.geom) {
                        instance.geom = sequelize.fn(
                            'ST_Force3D',
                            sequelize.fn(
                                'ST_SetSRID',
                                sequelize.fn(
                                    'ST_Multi', // Pastikan jadi Multi
                                    sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(instance.geom))
                                ),
                                4326
                            )
                        );
                    }
                }
            },

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
