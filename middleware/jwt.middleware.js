import { expressjwt } from 'express-jwt';
// import 'dotenv/config';

/**
 * JWT Middleware Factory
 * @param {string} [mode='required'] - Determines if authentication is required.
 * 'required': Throws an error if no token is present.
 * 'optional': Allows the request to proceed without a token.
 * @returns {Function} Express middleware.
 */
export const checkJwt = (mode = 'required') => {
    return expressjwt({
        secret: process.env.JWT_SECRET,
        algorithms: ['HS256'],
        // This is the key part: the value is determined by the `mode` parameter
        credentialsRequired: mode === 'required',
    });
};