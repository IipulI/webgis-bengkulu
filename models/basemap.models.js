import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Basemap extends Model {
        static associate(models) {
            // define assoc here
        }
    }

    Basemap.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            name: {
                type: DataTypes.STRING,
            },
            urlTemplate: {
                type: DataTypes.TEXT,
                field: "url_template"
            },
            attribution: {
                type: DataTypes.TEXT,
            },
            maxZoom: {
                type: DataTypes.INTEGER,
                field: "max_zoom"
            },
            isDefault: {
                type: DataTypes.BOOLEAN,
                field: "is_default"
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            tableName: "basemaps",
            modelName: "Basemap",
        }
    );

    return Basemap
}
