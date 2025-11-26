import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } = process.env;

let sequelizeConfig

if(process.env.NODE_ENV === "production")  {
    sequelizeConfig = {
        host: DB_HOST,
        dialect: DB_DIALECT,
        logging: true,

        timezone: 'Asia/Jakarta',

        dialectOptions: {
            useUTC: false,
            ssl: {
                require: true,
                rejectUnauthorized: false
             }
        }
    }
}
else{
    sequelizeConfig = {
        host: DB_HOST,
        dialect: DB_DIALECT,
        logging: true,

        timezone: '+07:00',
    }
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, sequelizeConfig);
