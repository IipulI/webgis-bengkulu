import models from '../models/index.js'
import { sequelize } from "../config/database.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import slug from "slug";

const { LayerSchema } = models

export const getAllLayerSchema = async(page, size) =>{
    const isPaginated = page != null && size != null;

    const queryBuilder = {
        attributes: ['id', 'name', 'subCategory', 'geometryType', 'description'],
        order: [['createdAt', 'DESC']],
    }

    if (isPaginated){
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;
    }

    try {
        const { count, rows } = await LayerSchema.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: isPaginated
        };
    }
    catch (error) {
        console.error(error);
        throw new Error(error.message);
    }
}

export const getOneLayerSchema = async(schemaId) => {
    let queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        where: {
            id: schemaId
        }
    }

    const data = await LayerSchema.findOne(queryBuilder)
    if (!data) {
        throw new NotFoundError("Data tidak ditemukan")
    }

    return data
}

export const createNewLayerSchema = async(schemaData) => {
    const sluggedSubCategory = slug(schemaData.name)
    const existSchema = await LayerSchema.findOne({
        attributes: ['subCategory'],
        where: {
            subCategory: sluggedSubCategory
        }
    })
    if (existSchema) {
        throw new ConflictError(`Tidak dapat membuat baru, kategori ${sluggedSubCategory} sudah ada`)
    }

    try {
        return await LayerSchema.create({
            name: schemaData.name,
            subCategory: sluggedSubCategory,
            geometryType: schemaData.geometryType,
            definition: schemaData.definition,
            description: schemaData.description,
            isActive: true
        });
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

export const updateLayerSchema = async(schemaId, schemaData) => {
    const layerSchema = await LayerSchema.findByPk(schemaId);
    if (!layerSchema) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    try {
        return await layerSchema.update({
            name: schemaData.name,
            geometryType: schemaData.geometryType,
            definition: schemaData.definition,
            description: schemaData.description,
            isActive: schemaData.isActive,
        })
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

export const deleteSchemaLayer = async(schemaId) => {
    const layerSchema = await LayerSchema.findByPk(schemaId);
    if (!layerSchema) {
        throw new NotFoundError("Layer tidak ditemukan")
    }

    try {
        await layerSchema.destroy()
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}