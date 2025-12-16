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

export const getCategoryReport = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)

    const data = [
        {
            name: "Bangungan Gedung",
            value: "bangunan-gedung"
        },
        {
            name: "Jaringan Jalan dan Jembatan",
            value: "jaringan-jalan-dan-jembatan"
        },
        {
            name: "Drainase Perkotaan dan Pengendalian Banjir",
            value: "drainase-perkotaan-dan-pengendalian-banjir"
        },
        {
            name: "Bangunan Sumber Daya Air dan Irigasi",
            value: "bangunan-sumber-daya-air-dan-irigasi"
        },
        {
            name: "Jaringan Air Minum",
            value: "jaringan-air-minum"
        },
        {
            name: "Pengolahaan Air Limbah dan Limbah B3 dan Sanitasi",
            value: "pengolahaan-air-limbah-dan-limbah-b3-dan-sanitasi"
        }
    ]

    return responseBuilder
        .status('success')
        .message("berhasil mengambil kategori")
        .json(data)
}

export const getSubCategoryReport = async (req, res, next) => {
    const category = req.query.category;
    const responseBuilder = new ResponseBuilder(res)

    let data
    switch (category) {
        case 'bangunan-gedung':
            data = [
                {
                    name: "Bangunan Gedung",
                    value: "bangunan-gedung"
                }
            ]
            break;
        case 'jaringan-jalan-dan-jembatan':
            data = [
                {
                    name: "Jaringan",
                    value: "jarignan"
                },
                {
                    name: "Jalan",
                    value: "jalan"
                },
                {
                    name: "Jembatan",
                    value: "jembatan"
                }
            ]
            break;
        case "drainase-perkotaan-dan-pengendalian-banjir":
            data = [
                {
                    name: "Drainase Perkotaan",
                    value: "drainase-perkotaan"
                },
                {
                    name: "Pengendalian Banjir",
                    value: "pengendalian-banjir"
                }
            ]
            break;
        case "bangunan-sumber-daya-air-dan-irigasi":
            data = [
                {
                    name: "Bangunan Sumber Daya Air",
                    value: "bangunan-sumber-daya-air"
                },
                {
                    name: "Irigasi",
                    value: "irigasi"
                }
            ]
            break;
        case "jaringan-air-minum":
            data = [
                {
                    name: "Jaringan Air Minum",
                    value: "jaringan-air-minum"
                }
            ]
            break;
        case "pengolahaan-air-limbah-dan-limbah-b3-dan-sanitasi":
            data = [
                {
                    name: "Pengendalian Air Limbah",
                    value: "pengendalian-air-limbah"
                },
                {
                    name: "Pengendalian Limbah B3",
                    value: "limbah-b3-dan-limbah"
                },
                {
                    name: "Sanitasi",
                    value: "sanitasi"
                }
            ]
            break;
        default:
            data = []
            break;
    }

    responseBuilder
        .status('success')
        .message("berhasil mengambil sub kategori")
        .json(data)
}