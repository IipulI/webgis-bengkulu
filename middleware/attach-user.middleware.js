import models from '../models/index.js'; // Adjust path
import { UnauthorizedError } from '../utils/custom-error.js'; // Adjust path
const { User, Role } = models

/**
 * Middleware to fetch the full user model from the database.
 * This should run AFTER the 'checkJwt' middleware.
 * It uses the user ID from the JWT payload (`req.auth.id`) to find the user
 * and attaches the Sequelize model instance to `req.user`.
 */
export const attachCurrentUser = async (req, res, next) => {
    try {
        if (req.auth && req.auth.id) {
            const userId = req.auth.id;

            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] },
                include: {
                    model: Role,
                    as: 'role'
                }
            });

            if (!user) {
                throw new UnauthorizedError('User associated with this token no longer exists.');
            }

            req.user = user;
        }

        return next();
    } catch (error) {
        return next(error);
    }
};
