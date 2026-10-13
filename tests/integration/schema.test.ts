import path from 'path';
import { execFileSync } from 'child_process';
import {
	ForeignKeyConstraintError,
	QueryTypes,
	UniqueConstraintError,
} from 'sequelize';
import { db, resetDb, closeDb } from '../helpers/db';
import { createUser, ensureUserRole } from '../helpers/factory';

const root = path.resolve(__dirname, '../..');

describe('database constraints', () => {
	beforeEach(async () => {
		await resetDb();
		await ensureUserRole();
	});

	afterAll(closeDb);

	it('rejects a user whose role does not exist', async () => {
		await expect(createUser({ roleId: 999 })).rejects.toBeInstanceOf(
			ForeignKeyConstraintError
		);
	});

	it('rejects a duplicate role name', async () => {
		await expect(
			db.role.create({ name: 'admin', description: null })
		).rejects.toBeInstanceOf(UniqueConstraintError);
	});

	it('refuses to delete a role that still has users', async () => {
		await createUser();
		await expect(
			db.role.destroy({ where: { id: 2 } })
		).rejects.toBeInstanceOf(ForeignKeyConstraintError);
	});

	it('names the constraints as the old flyway baseline did', async () => {
		const rows = await db.sequelize.query<{ conname: string }>(
			`SELECT conname FROM pg_constraint WHERE conname IN ('user_role_id_fkey', 'role_name_key')`,
			{ type: QueryTypes.SELECT }
		);
		expect(rows.map((r) => r.conname).sort()).toEqual([
			'role_name_key',
			'user_role_id_fkey',
		]);
	});

	// db:seed:all runs seeders alphabetically; the user needs its role first.
	it('seeds roles before users so db:seed:all satisfies the foreign key', async () => {
		await db.sequelize.query(
			'TRUNCATE TABLE "user", "role" RESTART IDENTITY CASCADE'
		);
		execFileSync(
			path.join(root, 'node_modules/.bin/sequelize'),
			['db:seed:all'],
			{ cwd: root, stdio: 'pipe' }
		);
		const [{ count }] = await db.sequelize.query<{ count: string }>(
			'SELECT count(*) FROM "user"',
			{ type: QueryTypes.SELECT }
		);
		expect(count).toBe('1');
	});
});
