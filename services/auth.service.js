import models from '../models/index.js'
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
import {BadRequestError} from "../utils/custom-error.js";
import { Op } from 'sequelize';

const { User, Role } = models

const login = async (loginIdentifier, password) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: loginIdentifier },
                { username: loginIdentifier }
            ]
        },
        include: {
            model: Role,
            as: 'role'
        }
    });

    if (!user) {
        throw new BadRequestError('Invalid credentials.');
    }

    console.log(`auth login, plain text password : ${password}`)

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new BadRequestError('Invalid credentials.');
    }

    // If credentials are correct, proceed to create the token
    const payload = { id: user.id, email: user.email, username: user.username };
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: '24h' };

    const token = jwt.sign(payload, secret, options);
    const userJson = user.toJSON();
    delete userJson.password; // Ensure password is not in the final user object

    return { userId: userJson.id, name: userJson.fullName, username: userJson.username, role: userJson.role.name, token };
};

export const authService = {
    login
}