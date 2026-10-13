import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import { resetDb, closeDb } from '../helpers/db';
import {
	ADMIN_ROLE_ID,
	ensureUserRole,
	createUser,
	bearer,
} from '../helpers/factory';

type Account = Awaited<ReturnType<typeof createUser>>;

describe('Role routes', () => {
	let admin: Account;
	let regular: Account;

	beforeEach(async () => {
		await resetDb();
		await ensureUserRole();
		admin = await createUser({ roleId: ADMIN_ROLE_ID });
		regular = await createUser();
	});

	afterAll(closeDb);

	it('returns 401 without a token', async () => {
		await request(app).get('/v1/roles').expect(httpStatus.UNAUTHORIZED);
	});

	describe('POST /v1/roles', () => {
		it('lets an admin create a role', async () => {
			const res = await request(app)
				.post('/v1/roles')
				.set('Authorization', bearer(admin.tokens))
				.send({ name: 'editor', description: 'can edit' })
				.expect(httpStatus.OK);

			expect(res.body.role).toMatchObject({
				name: 'editor',
				description: 'can edit',
			});
		});

		it('returns 409 for a duplicate name', async () => {
			await request(app)
				.post('/v1/roles')
				.set('Authorization', bearer(admin.tokens))
				.send({ name: 'admin' })
				.expect(httpStatus.CONFLICT);
		});

		it('returns 400 when the name is missing', async () => {
			await request(app)
				.post('/v1/roles')
				.set('Authorization', bearer(admin.tokens))
				.send({ description: 'no name' })
				.expect(httpStatus.BAD_REQUEST);
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.post('/v1/roles')
				.set('Authorization', bearer(regular.tokens))
				.send({ name: 'editor' })
				.expect(httpStatus.FORBIDDEN);
		});
	});

	describe('GET /v1/roles', () => {
		it('lists roles with a count', async () => {
			const res = await request(app)
				.get('/v1/roles')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			expect(res.body.roles.count).toBe(2);
			expect(
				res.body.roles.rows.map((r: { name: string }) => r.name)
			).toEqual(['admin', 'user']);
		});

		it('paginates', async () => {
			const res = await request(app)
				.get('/v1/roles')
				.query({ limit: 1, page: 2 })
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			expect(
				res.body.roles.rows.map((r: { name: string }) => r.name)
			).toEqual(['user']);
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.get('/v1/roles')
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.FORBIDDEN);
		});
	});

	describe('GET /v1/roles/:roleId', () => {
		it('returns the role', async () => {
			const res = await request(app)
				.get(`/v1/roles/${ADMIN_ROLE_ID}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);
			expect(res.body.role).toMatchObject({
				id: ADMIN_ROLE_ID,
				name: 'admin',
			});
		});

		it('returns 404 for a missing role', async () => {
			await request(app)
				.get('/v1/roles/999')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});

		it('returns 400 for a non-numeric id', async () => {
			await request(app)
				.get('/v1/roles/abc')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.BAD_REQUEST);
		});
	});

	describe('PATCH /v1/roles/:roleId', () => {
		it('lets an admin update a role', async () => {
			const res = await request(app)
				.patch('/v1/roles/2')
				.set('Authorization', bearer(admin.tokens))
				.send({ description: 'updated' })
				.expect(httpStatus.OK);

			expect(res.body.role).toMatchObject({
				id: 2,
				description: 'updated',
			});
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.patch('/v1/roles/2')
				.set('Authorization', bearer(regular.tokens))
				.send({ description: 'updated' })
				.expect(httpStatus.FORBIDDEN);
		});
	});

	describe('DELETE /v1/roles/:roleId', () => {
		it('lets an admin delete a role', async () => {
			await request(app)
				.post('/v1/roles')
				.set('Authorization', bearer(admin.tokens))
				.send({ name: 'temp' });
			const list = await request(app)
				.get('/v1/roles')
				.set('Authorization', bearer(admin.tokens));
			const temp = list.body.roles.rows.find(
				(r: { name: string }) => r.name === 'temp'
			);

			await request(app)
				.delete(`/v1/roles/${temp.id}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);
			await request(app)
				.get(`/v1/roles/${temp.id}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});

		it('returns 404 for a missing role', async () => {
			await request(app)
				.delete('/v1/roles/999')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.delete('/v1/roles/2')
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.FORBIDDEN);
		});
	});
});
