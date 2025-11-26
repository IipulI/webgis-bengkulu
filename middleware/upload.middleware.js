import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { BadRequestError } from '../utils/custom-error.js';

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * Creates a highly reusable Multer upload middleware based on a field configuration.
 * @param {Array<object>} fieldConfigs - An array of configuration objects for each expected field.
 * Each object should have: { name: string, maxCount: number, destination: string, allowedMimeTypes: Array<string> }
 */
export const createUploadMiddleware = (fieldConfigs) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // Find the configuration for the current file's fieldname
            const config = fieldConfigs.find(f => f.name === file.fieldname);
            if (!config) {
                return cb(new BadRequestError(`Unexpected file field: ${file.fieldname}`), null);
            }
            // Use the destination from the config
            const dest = path.join('uploads', config.destination);
            ensureDir(dest);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        },
    });

    const fileFilter = (req, file, cb) => {
        // Find the configuration for the current file's fieldname
        const config = fieldConfigs.find(f => f.name === file.fieldname);
        if (!config) {
            // This case should be caught by the destination logic, but as a safeguard:
            return cb(new BadRequestError(`File field ${file.fieldname} is not configured.`), false);
        }

        // Check if the file's mime type is in the allowed list
        if (config.allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new BadRequestError(`Invalid file type for ${file.fieldname}. Allowed types: ${config.allowedMimeTypes.join(', ')}`), false);
        }
    };

    // Prepare the fields array for Multer from our rich configuration
    const multerFields = fieldConfigs.map(f => ({ name: f.name, maxCount: f.maxCount }));

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 1024 * 1024 * 20 },
    }).fields(multerFields);
};

export const createRequiredFieldsValidator = (requiredFields) => {
    return (req, res, next) => {
        const files = req.files;

        // A basic check to ensure req.files is an object.
        if (!files || typeof files !== 'object') {
            return res.status(400).json({
                message: `Validation failed: Required files are missing: ${requiredFields.join(', ')}`
            });
        }

        // Loop through the list of fields we expect to be required.
        for (const fieldName of requiredFields) {
            // Check if the field is missing from the files object OR if it's an empty array.
            if (!files[fieldName] || files[fieldName].length === 0) {
                return res.status(400).json({
                    message: `Validation failed: '${fieldName}' is a required field.`,
                });
            }
        }

        next();
    };
};