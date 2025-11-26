/**
 * Role-Checking Middleware Factory
 * @param {string|string[]} roles - The role or list of roles that are allowed access.
 * @returns {Function} Express middleware.
 */
export const checkRole = (roles) => {
    return (req, res, next) => {
        // Ensure `roles` is an array for easier checking
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        // This middleware assumes `attachCurrentUser` has run and `req.user` is set.
        // It also assumes your User model has a `role` object with a `name` property.
        if (!req.user || !req.user.role || !req.user.role.name) {
            // This is a server error or a logic error (e.g., middleware order is wrong)
            // It's not a client "unauthorized" error, but rather a failure in the auth process.
            return res.status(401).json({ message: 'Authentication error: User role could not be determined.' });
        }

        const userRole = req.user.role.name;

        // Check if the user's role is in the list of allowed roles
        if (allowedRoles.includes(userRole)) {
            // The user has the required role, so continue to the next handler
            return next();
        } else {
            // The user does not have permission
            return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions to access this resource.' });
        }
    };
};