const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// sequelize-cli cannot load TypeScript, so it cannot import src/config/config.ts.
// It reads `username` (not `user`) and otherwise falls back to the OS user.
module.exports = {
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
	database: process.env.DB_NAME,
	dialect: process.env.DB_DIALECT || 'postgres',
};
