// config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
    development: {
        username: process.env.DB_USER_DEV,
        password: process.env.DB_PASS_DEV,
        database: process.env.DB_NAME_DEV,
        host: process.env.DB_HOST_DEV,
        port: process.env.DB_PORT_DEV,
        dialect: 'postgres',
        timezone: 'Asia/Jakarta',
        logging: true,
        dialectOptions: {
            useUTC: false
        }
    },
    test: {
        username: process.env.DB_USER_DEV,
        password: process.env.DB_PASS_DEV,
        database: process.env.DB_NAME_DEV,
        host: process.env.DB_HOST_DEV,
        port: process.env.DB_PORT_DEV,
        dialect: 'postgres'
    },
    production: {
        username: process.env.DB_USER_PROD,
        password: process.env.DB_PASS_PROD,
        database: process.env.DB_NAME_PROD,
        host: process.env.DB_HOST_PROD,
        port: process.env.DB_PORT_PROD,
        dialect: 'postgres',
        timezone: 'Asia/Jakarta',
        dialectOptions: {
            useUTC: false,
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};