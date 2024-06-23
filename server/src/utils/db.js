import { Sequelize } from "sequelize";
import "dotenv/config"

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    }
);

sequelize
    .authenticate()
    .then(() => {
        console.log('Successfully connected to database');
    })
    .catch(err => {
        console.error('Error while connecting to database:', err);
    });

export default sequelize;