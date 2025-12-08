import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
    class AssetView extends Model {
        static associate(models) {
            this.belongsTo(models.Layer, {
                foreignKey: 'layer_id',
                as: 'layer'
            })
        }
    }

    AssetView.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
            },
            layerId: {
                type: DataTypes.UUID,
                field: 'layer_id'
            },
            layerName: {
                type: DataTypes.STRING,
                field: 'layer_name'
            },
            category:{
                type: DataTypes.STRING,
            },
            subCategory: {
                type: DataTypes.STRING,
                field: 'sub_category'
            },
            name: {
                type: DataTypes.STRING,
            },
            regNumber: {
                type: DataTypes.STRING,
                field: 'reg_number'
            },
            assetCode: {
                type: DataTypes.STRING,
                field: 'asset_code'
            },
            condition: {
                type: DataTypes.STRING,
            },
            yearBuilt: {
                type: DataTypes.INTEGER,
                field: 'year_built'
            },
            managedBy: {
                type: DataTypes.STRING,
                field: 'managed_by'
            },
            properties: {
                type: DataTypes.JSONB,
            },
            assetType: {
                type: DataTypes.STRING,
                field: 'asset_type'
            },
            geom: {
                type: DataTypes.GEOMETRY,
            },
            createdAt: {
                type: DataTypes.DATE,
                field: 'created_at'
            },
            updatedAt: {
                type: DataTypes.DATE,
                field: 'updated_at'
            }
        },
        {
            sequelize,
            modelName: 'AssetView',
            tableName: 'view_all_assets',
            underscored: true,

            timestamps: false,
            paranoid: false,

            freezeTableName: true
        }
    );

    return AssetView;
};