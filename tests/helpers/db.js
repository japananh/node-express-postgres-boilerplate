const db = require('../../src/db/models');
const { postgres } = require('../../src/config/postgres');
const roleSeeder = require('../../src/db/seeders/20210227143959-demo-role');
const userSeeder = require('../../src/db/seeders/20210227143330-demo-user');

const queryInterface = db.sequelize.getQueryInterface();

// Truncate and re-run the real seeders; RESTART IDENTITY keeps role ids at
// 1 (admin, seeded) and 2 (user), which config/roles.js hardcodes.
async function resetDb() {
	await db.sequelize.query(
		'TRUNCATE TABLE "user", "role" RESTART IDENTITY CASCADE'
	);
	await roleSeeder.up(queryInterface);
	await userSeeder.up(queryInterface);
}

async function closeDb() {
	await db.sequelize.close();
	// config/postgres.js opens its own pg client at import time.
	await postgres.end();
}

module.exports = { db, resetDb, closeDb };
