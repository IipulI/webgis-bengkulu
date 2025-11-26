import http from 'http';
import app from './app.js';
import { sequelize } from './config/database.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // await sequelize.sync();
        // console.log("All models were synchronized successfully.");

        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database or start the server:', error);
        process.exit(1);
    }
}

startServer();