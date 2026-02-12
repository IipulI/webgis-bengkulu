import db from '../models/index.js';
import { Op } from 'sequelize';
import ResponseBuilder from "../utils/response.js";
import { getPagination, getPagingData } from "../utils/pagination.js";

const { AssetView, LayerSchema, Sequelize } = db;

export const getAssetReport = async (query) => {
    const {
        page = 1,
        size = 10,
        search,
        category,
        subCategory,
        condition,
        yearBuilt,
        asset_type,
        ...otherFilters
    } = query;

    const { limit, offset } = getPagination(page, size);

    let whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { reg_number: { [Op.iLike]: `%${search}%` } }
        ];
    }

    if (condition) whereClause.condition = condition;
    if (yearBuilt) whereClause.yearBuilt = yearBuilt;
    if (asset_type) whereClause.asset_type = asset_type;
    if (category) whereClause.category = category;
    if (subCategory) whereClause.subCategory = subCategory;

    Object.keys(otherFilters).forEach(key => {
        if (key.startsWith('prop_')) {
            const jsonKey = key.replace('prop_', ''); // ambil key asli, misal 'vendor'
            const value = otherFilters[key];

            whereClause[Op.and] = [
                ...(whereClause[Op.and] || []), // Pertahankan existing AND jika ada
                Sequelize.where(
                    Sequelize.literal(`"properties"->>'${jsonKey}'`),
                    value
                )
            ];
        }
    });

    const { count, rows } = await AssetView.findAndCountAll({
        where: whereClause,
        attributes: [
            'id', 'layerId', 'regNumber', 'name', 'layerName', 'category', 'subCategory', 'condition', 'yearBuilt', 'managedBy', 'properties', 'assetType'
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
    });

    const layerSchema = await LayerSchema.findOne({
        where: {
            subCategory: {
                [Op.in]: [category, subCategory]
            }
        }
    });

    const result = rows.map(asset => {
        const plainAsset = asset.get({plain: true});

        const unslugCategory = unslug(plainAsset.category)
        const unslugSubCategory = unslug(plainAsset.subCategory)

        plainAsset.category = unslugCategory;
        plainAsset.subCategory = unslugSubCategory;

        return plainAsset;
    })

    return {
        count,
        layerSchema: layerSchema,
        rows: result,
        isPaginated: true,
    }
};

function unslug(slug) {
    if (!slug) return "";

    return slug
        .split("-")
        .filter(Boolean) // remove empty segments
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
}