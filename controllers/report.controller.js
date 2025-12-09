import db from '../models/index.js'; // Pastikan path ini sesuai dengan loader Anda
import { Op } from 'sequelize';
import ResponseBuilder from "../utils/response.js";
import { getPagination, getPagingData } from "../utils/pagination.js";

const { AssetView, Sequelize } = db;

export const getAssetReport = async (req, res, next) => {
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
    } = req.query;
    const responseBuilder = new ResponseBuilder(res)

    const { limit, offset } = getPagination(page, size);

    try {
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

        const data = {
            count,
            rows,
            isPaginated: true,
        }

        let payload = getPagingData(data, page, size)

        responseBuilder
            .status('success')
            .message("berhasil mengambil data")
            .json(payload)

    } catch (error) {
        console.error('Error fetching asset report:', error);
        next(error)
    }
};