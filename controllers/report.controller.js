import db from '../models/index.js'; // Pastikan path ini sesuai dengan loader Anda
import { Op } from 'sequelize';

const { AssetView, Sequelize } = db;

export const getAssetReport = async (req, res) => {
    const responseBuilder = new Res

    try {
        const {
            page = 1,
            limit = 10,
            search,
            category,
            subCategory,
            condition,
            yearBuilt,
            asset_type,
            ...otherFilters // Menangkap filter dinamis (prop_...)
        } = req.query;

        const offset = (page - 1) * limit;

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
        if (year_built) whereClause.year_built = year_built;
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
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            status: 'success',
            meta: {
                total_data: count,
                total_page: Math.ceil(count / limit),
                page: parseInt(page),
                limit: parseInt(limit)
            },
            data: rows
        });

    } catch (error) {
        console.error('Error fetching asset report:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};