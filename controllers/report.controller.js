import db from '../models/index.js'; // Pastikan path ini sesuai dengan loader Anda
import { Op } from 'sequelize';
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";

const { AssetView, Sequelize } = db;

export const getAssetReport = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const {
            page = 1,
            size = 10,
            search,
            category,
            subCategory,
            condition,
            yearBuilt,
            asset_type,
            ...otherFilters // Menangkap filter dinamis (prop_...)
        } = req.query;

        const offset = (page - 1) * size;

        // 1. Base Condition
        let whereClause = {};

        // 2. Filter Global (Search by Name or Code)
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { reg_number: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // 3. Filter Kolom Standar
        if (condition) whereClause.condition = condition;
        if (yearBuilt) whereClause.yearBuilt = yearBuilt;
        if (asset_type) whereClause.asset_type = asset_type;
        if (category) whereClause.category = category;
        if (subCategory) whereClause.subCategory = subCategory;

        // 4. Filter Dinamis JSONB Properties
        // Aturan: Client mengirim param dengan prefix "prop_", misal: ?prop_vendor=Cisco
        Object.keys(otherFilters).forEach(key => {
            if (key.startsWith('prop_')) {
                const jsonKey = key.replace('prop_', ''); // ambil key asli, misal 'vendor'
                const value = otherFilters[key];

                // Query PostgreSQL JSONB: properties ->> 'key' = 'value'
                // Kita gunakan Sequelize.literal agar efisien
                whereClause[Op.and] = [
                    ...(whereClause[Op.and] || []), // Pertahankan existing AND jika ada
                    Sequelize.where(
                        Sequelize.literal(`"properties"->>'${jsonKey}'`),
                        value
                    )
                ];
            }
        });

        // 5. Eksekusi Query
        const { count, rows } = await AssetView.findAndCountAll({
            where: whereClause,
            attributes: [
                'id', 'layerId', 'regNumber', 'name', 'layerName', 'category', 'subCategory', 'condition', 'yearBuilt', 'managedBy', 'properties', 'assetType'
            ],
            size: parseInt(size),
            offset: parseInt(offset),
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