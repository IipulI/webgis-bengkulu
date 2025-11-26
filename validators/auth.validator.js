// /validators/auth.validator.js
import Joi from 'joi';
import { UnprocessableEntityError } from '../utils/custom-error.js'; // Adjust path

// Define the schema for login
const loginSchema = Joi.object({
    // 'loginIdentifier' can be an email or a plain string (for username)
    username: Joi.alternatives().try(
        Joi.string().email(),
        Joi.string().min(3).max(30)
    ).required().label('Username or Email'),

    password: Joi.string().required(),
});

/**
 * Middleware function to validate the login request body against the loginSchema.
 */
export const validateLogin = (req, res, next) => {
    const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true, // Remove unknown fields from the validated output
    });

    if (error) {
        // If validation fails, create a structured error object
        const formattedErrors = error.details.reduce((acc, current) => {
            // Joi's error path is an array, e.g., ['loginIdentifier']
            const key = current.path[0];
            acc[key] = current.message.replace(/['"]/g, ''); // Clean up message
            return acc;
        }, {});

        // Throw a specific error that our global handler will catch
        throw new UnprocessableEntityError(formattedErrors);
    }

    // Replace req.body with the validated and cleaned value
    req.body = value;
    next();
};
