import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import * as emailService from '../../src/services/email.service';
import { generateToken, generateExpires } from '../../src/utils/auth';
import { db, resetDb, closeDb } from '../helpers/db';
import { ADMIN_ROLE_ID, USER_ROLE_ID, createUser } from '../helpers/factory';

describe('Auth routes', () => {
	let sendMail: jest.SpyInstance;

	beforeEach(async () => {
		await resetDb();
		sendMail = jest
			.spyOn(emailService.transport, 'sendMail')
			.mockResolvedValue({} as never);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(closeDb);

	describe('POST /v1/auth/register', () => {
		const body = () => ({
			name: 'Jane',
			email: 'jane@example.com',
			password: 'password1',
		});

		it('creates the user and returns tokens without the password', async () => {
			const res = await request(app)
				.post('/v1/auth/register')
				.send(body())
				.expect(httpStatus.CREATED);

			expect(res.body.user).toMatchObject({
				name: 'Jane',
				email: 'jane@example.com',
				role_id: USER_ROLE_ID,
			});
			expect(res.body.user).not.toHaveProperty('password');
			expect(res.body.tokens.access.token).toEqual(expect.any(String));
			expect(res.body.tokens.refresh.token).toEqual(expect.any(String));
		});

		it('returns 409 for a duplicate email', async () => {
			await request(app).post('/v1/auth/register').send(body());
			const res = await request(app)
				.post('/v1/auth/register')
				.send(body())
				.expect(httpStatus.CONFLICT);
			expect(res.body.message).toBe('This email already exits');
		});

		it.each([[ADMIN_ROLE_ID], [USER_ROLE_ID], [999]])(
			'rejects a client-supplied roleId (%i) with 400 and creates no user',
			async (roleId) => {
				const res = await request(app)
					.post('/v1/auth/register')
					.send({ ...body(), roleId })
					.expect(httpStatus.BAD_REQUEST);
				expect(res.body.message).toBe('"roleId" is not allowed');
				expect(
					await db.user.count({ where: { email: body().email } })
				).toBe(0);
			}
		);

		it('always assigns the user role, looked up by name', async () => {
			const res = await request(app)
				.post('/v1/auth/register')
				.send(body())
				.expect(httpStatus.CREATED);

			const stored = await db.user.findByPk(res.body.user.id);
			const role = await db.role.findByPk(stored!.role_id);
			expect(role!.name).toBe('user');
			expect(stored!.role_id).not.toBe(ADMIN_ROLE_ID);
		});

		it('returns an operational 500 when the user role is missing', async () => {
			await db.sequelize.query('TRUNCATE TABLE "user", "role" CASCADE');
			const res = await request(app)
				.post('/v1/auth/register')
				.send(body())
				.expect(httpStatus.INTERNAL_SERVER_ERROR);
			expect(res.body.message).toMatch(/"user" is not seeded/);
		});

		it('gives a registered user no admin access', async () => {
			const res = await request(app)
				.post('/v1/auth/register')
				.send(body())
				.expect(httpStatus.CREATED);
			await request(app)
				.get('/v1/roles')
				.set('Authorization', `Bearer ${res.body.tokens.access.token}`)
				.expect(httpStatus.FORBIDDEN);
		});

		it.each([
			['a weak password', { password: 'short' }],
			['a password without a digit', { password: 'onlyletters' }],
			['an invalid email', { email: 'nope' }],
			['a missing name', { name: undefined }],
		])('returns 400 for %s', async (_label, override) => {
			await request(app)
				.post('/v1/auth/register')
				.send({ ...body(), ...override })
				.expect(httpStatus.BAD_REQUEST);
		});
	});

	describe('POST /v1/auth/login', () => {
		it('logs in with valid credentials', async () => {
			const { user } = await createUser({ roleId: ADMIN_ROLE_ID });
			const res = await request(app)
				.post('/v1/auth/login')
				.send({ email: user.email, password: 'password1' })
				.expect(httpStatus.OK);

			expect(res.body.user.email).toBe(user.email);
			expect(res.body.user).not.toHaveProperty('password');
			expect(res.body.tokens.access.token).toEqual(expect.any(String));
		});

		it('returns 401 for a wrong password', async () => {
			const { user } = await createUser();
			const res = await request(app)
				.post('/v1/auth/login')
				.send({ email: user.email, password: 'wrong-password1' })
				.expect(httpStatus.UNAUTHORIZED);
			expect(res.body.message).toBe('Invalid email or password');
		});

		it('returns 401 for an unknown email', async () => {
			await request(app)
				.post('/v1/auth/login')
				.send({ email: 'ghost@example.com', password: 'password1' })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('returns 400 when the body is incomplete', async () => {
			await request(app)
				.post('/v1/auth/login')
				.send({ email: 'a@b.co' })
				.expect(httpStatus.BAD_REQUEST);
		});
	});

	describe('POST /v1/auth/refresh-tokens', () => {
		it('issues a new token pair for a valid refresh token', async () => {
			const { user, tokens } = await createUser();
			const res = await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({ refreshToken: tokens.refresh.token })
				.expect(httpStatus.OK);

			expect(res.body.access.token).toEqual(expect.any(String));
			expect(res.body.refresh.token).toEqual(expect.any(String));

			// The new access token must be usable and carry the user's role.
			await request(app)
				.get(`/v1/users/${user.id}`)
				.set('Authorization', `Bearer ${res.body.access.token}`)
				.expect(httpStatus.OK);
		});

		it('rejects an access token used as a refresh token', async () => {
			const { tokens } = await createUser();
			await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({ refreshToken: tokens.access.token })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('rejects a malformed token', async () => {
			await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({ refreshToken: 'not-a-jwt' })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('rejects an expired refresh token', async () => {
			const { user } = await createUser();
			const expired = generateToken(
				{ userId: user.id },
				generateExpires(-1)
			);
			await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({ refreshToken: expired })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('rejects a refresh token whose user no longer exists', async () => {
			const { user, tokens } = await createUser();
			await request(app)
				.delete(`/v1/users/${user.id}`)
				.set('Authorization', `Bearer ${tokens.access.token}`);
			const res = await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({ refreshToken: tokens.refresh.token });
			expect(res.status).toBe(httpStatus.UNAUTHORIZED);
		});

		it('returns 400 when refreshToken is missing', async () => {
			await request(app)
				.post('/v1/auth/refresh-tokens')
				.send({})
				.expect(httpStatus.BAD_REQUEST);
		});
	});

	describe('POST /v1/auth/forgot-password', () => {
		it('sends a reset email for a known address', async () => {
			const { user } = await createUser();
			await request(app)
				.post('/v1/auth/forgot-password')
				.send({ email: user.email })
				.expect(httpStatus.OK);

			expect(sendMail).toHaveBeenCalledTimes(1);
			expect(sendMail.mock.calls[0][0]).toMatchObject({
				to: user.email,
				subject: 'Reset password',
			});
			expect(sendMail.mock.calls[0][0].text).toMatch(/token=[\w.-]+/);
		});

		it('returns 503, with no token in the response, when the mail transport fails', async () => {
			const { user } = await createUser();
			sendMail.mockRejectedValue(
				Object.assign(new Error('getaddrinfo ENOTFOUND email-server'), {
					code: 'EDNS',
				})
			);
			const res = await request(app)
				.post('/v1/auth/forgot-password')
				.send({ email: user.email })
				.expect(httpStatus.SERVICE_UNAVAILABLE);

			expect(res.body).toEqual({
				code: 503,
				message: 'Email service unavailable',
			});
			// Reset tokens are stateless JWTs that only ever travel inside the
			// email, so a failed send leaves nothing usable behind.
			expect(JSON.stringify(res)).not.toMatch(/token=/);
			expect(sendMail).toHaveBeenCalledTimes(1);
		});

		it('returns 404 for an unknown address', async () => {
			await request(app)
				.post('/v1/auth/forgot-password')
				.send({ email: 'ghost@example.com' })
				.expect(httpStatus.NOT_FOUND);
			expect(sendMail).not.toHaveBeenCalled();
		});
	});

	describe('POST /v1/auth/reset-password', () => {
		const requestResetToken = async (email: string) => {
			await request(app).post('/v1/auth/forgot-password').send({ email });
			return sendMail.mock.calls[0][0].text.match(/token=([\w.-]+)/)![1];
		};

		it('resets the password so the new one logs in', async () => {
			const { user } = await createUser();
			const token = await requestResetToken(user.email);

			await request(app)
				.post('/v1/auth/reset-password')
				.query({ token })
				.send({ password: 'newpassword1' })
				.expect(httpStatus.OK);

			await request(app)
				.post('/v1/auth/login')
				.send({ email: user.email, password: 'newpassword1' })
				.expect(httpStatus.OK);
			await request(app)
				.post('/v1/auth/login')
				.send({ email: user.email, password: 'password1' })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('returns 401 for an invalid token', async () => {
			await request(app)
				.post('/v1/auth/reset-password')
				.query({ token: 'garbage' })
				.send({ password: 'newpassword1' })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('returns 401 when an access token is used as a reset token', async () => {
			const { tokens } = await createUser();
			await request(app)
				.post('/v1/auth/reset-password')
				.query({ token: tokens.access.token })
				.send({ password: 'newpassword1' })
				.expect(httpStatus.UNAUTHORIZED);
		});

		it('returns 400 for a missing token or a weak password', async () => {
			await request(app)
				.post('/v1/auth/reset-password')
				.send({ password: 'newpassword1' })
				.expect(httpStatus.BAD_REQUEST);
			await request(app)
				.post('/v1/auth/reset-password')
				.query({ token: 'x' })
				.send({ password: 'short' })
				.expect(httpStatus.BAD_REQUEST);
		});
	});
});
