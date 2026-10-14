import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import { db, resetDb, closeDb } from '../helpers/db';
import { createUser } from '../helpers/factory';

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const userSeeder = require('../../src/db/seeders/20210227144500-demo-user');

describe('demo user seeder', () => {
	beforeEach(resetDb);
	afterAll(closeDb);

	it('seeds an admin that logs in with the documented password', async () => {
		const res = await request(app)
			.post('/v1/auth/login')
			.send({ email: 'example@example.com', password: 'password1' })
			.expect(httpStatus.OK);
		expect(res.body.user.role_id).toBe(1);
	});

	it('down removes only the demo admin', async () => {
		const { user } = await createUser();
		await userSeeder.down(db.sequelize.getQueryInterface());
		const emails = (await db.user.findAll()).map((u) => u.email);
		expect(emails).toEqual([user.email]);
	});
});
