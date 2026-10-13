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

describe('User routes', () => {
	let admin: Account;
	let regular: Account;

	beforeEach(async () => {
		await resetDb();
		await ensureUserRole();
		admin = await createUser({ roleId: ADMIN_ROLE_ID });
		regular = await createUser();
	});

	afterAll(closeDb);

	describe('authentication', () => {
		it('returns 401 without a token', async () => {
			await request(app).get('/v1/users').expect(httpStatus.UNAUTHORIZED);
		});

		it('returns 401 with a token signed by another secret', async () => {
			const forged =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVJZCI6MX0.' +
				'aW52YWxpZC1zaWduYXR1cmUtaW52YWxpZC1zaWduYXR1cmU';
			await request(app)
				.get('/v1/users')
				.set('Authorization', `Bearer ${forged}`)
				.expect(httpStatus.UNAUTHORIZED);
		});
	});

	describe('GET /v1/users', () => {
		it('lets an admin list users with a count', async () => {
			const res = await request(app)
				.get('/v1/users')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			// demo seed + admin + regular
			expect(res.body.users.count).toBe(3);
			expect(res.body.users.rows).toHaveLength(3);
			res.body.users.rows.forEach((row: object) => {
				expect(row).not.toHaveProperty('password');
			});
		});

		it('paginates with limit and page', async () => {
			const res = await request(app)
				.get('/v1/users')
				.query({ limit: 2, page: 2 })
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			expect(res.body.users.count).toBe(3);
			expect(res.body.users.rows).toHaveLength(1);
		});

		it('returns 400 for an invalid page', async () => {
			await request(app)
				.get('/v1/users')
				.query({ page: 0 })
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.BAD_REQUEST);
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.get('/v1/users')
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.FORBIDDEN);
		});
	});

	describe('GET /v1/users/:userId', () => {
		it('lets an admin read any user', async () => {
			const res = await request(app)
				.get(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			expect(res.body.user).toMatchObject({
				id: regular.user.id,
				email: regular.user.email,
			});
			expect(res.body.user).not.toHaveProperty('password');
		});

		it('lets a regular user read themselves', async () => {
			await request(app)
				.get(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.OK);
		});

		it('forbids a regular user from reading someone else', async () => {
			await request(app)
				.get(`/v1/users/${admin.user.id}`)
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.FORBIDDEN);
		});

		it('returns 404 for a missing user', async () => {
			await request(app)
				.get('/v1/users/99999')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});
	});

	describe('PATCH /v1/users/:userId', () => {
		it('lets an admin update a user', async () => {
			const res = await request(app)
				.patch(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.send({ name: 'Renamed' })
				.expect(httpStatus.OK);

			expect(res.body.user.name).toBe('Renamed');
			expect(res.body.user).not.toHaveProperty('password');
		});

		it('hashes a changed password', async () => {
			await request(app)
				.patch(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.send({ password: 'brandnew1' })
				.expect(httpStatus.OK);

			await request(app)
				.post('/v1/auth/login')
				.send({ email: regular.user.email, password: 'brandnew1' })
				.expect(httpStatus.OK);
		});

		it('lets a regular user update themselves', async () => {
			await request(app)
				.patch(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(regular.tokens))
				.send({ name: 'Me' })
				.expect(httpStatus.OK);
		});

		it('forbids a regular user from updating someone else', async () => {
			await request(app)
				.patch(`/v1/users/${admin.user.id}`)
				.set('Authorization', bearer(regular.tokens))
				.send({ name: 'Hacked' })
				.expect(httpStatus.FORBIDDEN);
		});

		it('returns 409 when the email is taken', async () => {
			await request(app)
				.patch(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.send({ email: admin.user.email })
				.expect(httpStatus.CONFLICT);
		});

		it('returns 400 for an empty body', async () => {
			await request(app)
				.patch(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.send({})
				.expect(httpStatus.BAD_REQUEST);
		});
	});

	describe('DELETE /v1/users/:userId', () => {
		it('lets an admin delete a user', async () => {
			await request(app)
				.delete(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			await request(app)
				.get(`/v1/users/${regular.user.id}`)
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});

		it('returns 404 when the user does not exist', async () => {
			await request(app)
				.delete('/v1/users/99999')
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.NOT_FOUND);
		});

		it('forbids a regular user from deleting someone else', async () => {
			await request(app)
				.delete(`/v1/users/${admin.user.id}`)
				.set('Authorization', bearer(regular.tokens))
				.expect(httpStatus.FORBIDDEN);
		});
	});
});
