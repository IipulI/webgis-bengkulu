import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class FeatureAttachment extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    FeatureAttachment.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            layerId: {
                type: DataTypes.UUID,
                field: "layer_id"
            },
            featureId: {
                type: DataTypes.UUID,
                field: "feature_id"
            },
            fileUrl: {
                type: DataTypes.TEXT,
                field: "file_url"
            },
            fileType: {
                type: DataTypes.STRING,
                field: "file_type"
            },
            description: {
                type: DataTypes.TEXT,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "feature_attachments",
            modelName: "FeatureAttachment",
        }
    );

    return FeatureAttachment
}
