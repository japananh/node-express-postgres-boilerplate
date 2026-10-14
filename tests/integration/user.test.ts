import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import config from '../../src/config/config';
import { db, resetDb, closeDb } from '../helpers/db';
import { ADMIN_ROLE_ID, createUser, bearer } from '../helpers/factory';

type Account = Awaited<ReturnType<typeof createUser>>;

describe('User routes', () => {
	let admin: Account;
	let regular: Account;

	beforeEach(async () => {
		await resetDb();
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

	describe('authentication in production', () => {
		beforeEach(() => {
			config.env = 'production';
		});

		afterEach(() => {
			config.env = 'test';
		});

		it('returns 401, not a masked 500, without a token', async () => {
			const res = await request(app)
				.get('/v1/users')
				.expect(httpStatus.UNAUTHORIZED);
			expect(res.body.code).toBe(httpStatus.UNAUTHORIZED);
		});

		it('returns 401 for a malformed token', async () => {
			await request(app)
				.get('/v1/users')
				.set('Authorization', 'Bearer not-a-jwt')
				.expect(httpStatus.UNAUTHORIZED);
		});
	});

	describe('POST /v1/users', () => {
		const body = () => ({
			name: 'New Person',
			email: 'new.person@example.com',
			password: 'password1',
			roleId: 2,
		});

		it('lets an admin create a user with a hashed password', async () => {
			const res = await request(app)
				.post('/v1/users')
				.set('Authorization', bearer(admin.tokens))
				.send(body())
				.expect(httpStatus.CREATED);

			expect(res.body.user).toMatchObject({
				name: 'New Person',
				email: 'new.person@example.com',
				role_id: 2,
			});
			expect(res.body.user).not.toHaveProperty('password');

			const stored = await db.user.findByPk(res.body.user.id);
			expect(stored!.password).not.toBe('password1');
			await request(app)
				.post('/v1/auth/login')
				.send({
					email: 'new.person@example.com',
					password: 'password1',
				})
				.expect(httpStatus.OK);
		});

		it('returns 409 for a duplicate email', async () => {
			await request(app)
				.post('/v1/users')
				.set('Authorization', bearer(admin.tokens))
				.send({ ...body(), email: regular.user.email })
				.expect(httpStatus.CONFLICT);
		});

		it('returns 404 for an unknown role', async () => {
			await request(app)
				.post('/v1/users')
				.set('Authorization', bearer(admin.tokens))
				.send({ ...body(), roleId: 999 })
				.expect(httpStatus.NOT_FOUND);
		});

		it.each([
			['a missing field', { name: undefined }],
			['a weak password', { password: 'short' }],
			['a bad email', { email: 'nope' }],
		])('returns 400 for %s', async (_label, patch) => {
			await request(app)
				.post('/v1/users')
				.set('Authorization', bearer(admin.tokens))
				.send({ ...body(), ...patch })
				.expect(httpStatus.BAD_REQUEST);
		});

		it('returns 403 for a regular user', async () => {
			await request(app)
				.post('/v1/users')
				.set('Authorization', bearer(regular.tokens))
				.send(body())
				.expect(httpStatus.FORBIDDEN);
		});

		it('returns 401 without a token', async () => {
			await request(app)
				.post('/v1/users')
				.send(body())
				.expect(httpStatus.UNAUTHORIZED);
		});
	});

	describe('GET /v1/users', () => {
		it.each([
			['name:asc', ['Amy', 'Nana', 'Zed']],
			['name:desc', ['Zed', 'Nana', 'Amy']],
		])('sorts by %s', async (sortBy, names) => {
			await db.user.update(
				{ name: 'Zed' },
				{ where: { id: admin.user.id } }
			);
			await db.user.update(
				{ name: 'Amy' },
				{ where: { id: regular.user.id } }
			);
			const res = await request(app)
				.get('/v1/users')
				.query({ sortBy })
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			expect(
				res.body.users.rows.map((r: { name: string }) => r.name)
			).toEqual(names);
		});

		it('sorts by id descending', async () => {
			const res = await request(app)
				.get('/v1/users')
				.query({ sortBy: 'id:desc' })
				.set('Authorization', bearer(admin.tokens))
				.expect(httpStatus.OK);

			const ids = res.body.users.rows.map((r: { id: number }) => r.id);
			expect(ids).toEqual([...ids].sort((a, b) => b - a));
		});

		it.each(['password:asc', 'name', 'name:sideways', 'id:asc;x'])(
			'returns 400 for sortBy=%s',
			async (sortBy) => {
				await request(app)
					.get('/v1/users')
					.query({ sortBy })
					.set('Authorization', bearer(admin.tokens))
					.expect(httpStatus.BAD_REQUEST);
			}
		);

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

	describe.each(['get', 'patch', 'delete'] as const)(
		'%s /v1/users/:userId with a bad id',
		(method) => {
			it.each(['abc', '1.5', '0', '99999999999'])(
				'returns 400 for %s',
				async (id) => {
					await request(app)
						[method](`/v1/users/${id}`)
						.set('Authorization', bearer(admin.tokens))
						.send({ name: 'x' })
						.expect(httpStatus.BAD_REQUEST);
				}
			);
		}
	);

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

		it('returns 404 for a missing user', async () => {
			await request(app)
				.patch('/v1/users/999')
				.set('Authorization', bearer(admin.tokens))
				.send({ name: 'x' })
				.expect(httpStatus.NOT_FOUND);
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
