import db from '../models/index.js'; // Pastikan path ini sesuai dengan loader Anda
import ResponseBuilder from "../utils/response.js";
import { getPagingData } from "../utils/pagination.js";
import * as reportService from '../services/report.service.js'

const { AssetView, Sequelize } = db;

export const getAssetReport = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res)
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;

    try {
        const data = await reportService.getAssetReport(req.query);

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
            value: "bangunan-gedung",
            subCategory: [
                {
                    name: "Bangungan Gedung",
                    value: "bangunan-gedung",
                }
            ]
        },
        {
            name: "Jaringan Jalan dan Jembatan",
            value: "jaringan-jalan-dan-jembatan",
            subCategory: [
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
        },
        {
            name: "Drainase Perkotaan dan Pengendalian Banjir",
            value: "drainase-perkotaan-dan-pengendalian-banjir",
            subCategory: [
                {
                    name: "Drainase Perkotaan",
                    value: "drainase-perkotaan"
                },
                {
                    name: "Pengendalian Banjir",
                    value: "pengendalian-banjir"
                }
            ]
        },
        {
            name: "Bangunan Sumber Daya Air dan Irigasi",
            value: "bangunan-sumber-daya-air-dan-irigasi",
            subCategory: [
                {
                    name: "Bangunan Sumber Daya Air",
                    value: "bangunan-sumber-daya-air"
                },
                {
                    name: "Irigasi",
                    value: "irigasi"
                }
            ]
        },
        {
            name: "Jaringan Air Minum",
            value: "jaringan-air-minum",
            subCategory: [
                {
                    name: "Jaringan Air Minum",
                    value: "jaringan-air-minum"
                }
            ]
        },
        {
            name: "Pengolahaan Air Limbah dan Limbah B3 dan Sanitasi",
            value: "pengolahaan-air-limbah-dan-limbah-b3-dan-sanitasi",
            subCategory: [
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