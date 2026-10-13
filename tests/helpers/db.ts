import type { QueryInterface } from 'sequelize';
import { sequelize, Role, User } from '../../src/db/models';
import { postgres } from '../../src/config/postgres';

// The seeders are plain JS (sequelize-cli cannot load TypeScript).
interface Seeder {
	up(queryInterface: QueryInterface): Promise<unknown>;
}
/* eslint-disable @typescript-eslint/no-var-requires */
const roleSeeder: Seeder = require('../../src/db/seeders/20210227143959-demo-role');
const userSeeder: Seeder = require('../../src/db/seeders/20210227143330-demo-user');
/* eslint-enable @typescript-eslint/no-var-requires */

const db = { sequelize, role: Role, user: User };

const queryInterface = sequelize.getQueryInterface();

// Truncate and re-run the real seeders; RESTART IDENTITY keeps role ids at
// 1 (admin, seeded) and 2 (user), which config/roles.ts hardcodes.
async function resetDb() {
	await sequelize.query(
		'TRUNCATE TABLE "user", "role" RESTART IDENTITY CASCADE'
	);
	await roleSeeder.up(queryInterface);
	await userSeeder.up(queryInterface);
}

async function closeDb() {
	await sequelize.close();
	// config/postgres.ts opens its own pg client at import time.
	await postgres.end();
}

export { db, resetDb, closeDb };
