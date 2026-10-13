const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

// sequelize-cli cannot load TypeScript, so it cannot import src/config/config.ts.
// It reads `username` (not `user`) and otherwise falls back to the OS user.
module.exports = {
	username: process.env.SQL_USERNAME,
	password: process.env.SQL_PASSWORD,
	host: process.env.SQL_HOST,
	port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined,
	database: process.env.SQL_DATABASE_NAME,
	dialect: process.env.SQL_DIALECT || 'postgres',
};
