jest.mock('../../../src/services/user.service');

const jwt = require('jsonwebtoken');
const userService = require('../../../src/services/user.service');
const tokenService = require('../../../src/services/token.service');
const config = require('../../../src/config/config');

describe('token.service', () => {
	beforeEach(() => jest.resetAllMocks());

	describe('generateAuthTokens', () => {
		it('issues an access token with userId + roleId and a refresh token with userId only', async () => {
			const { access, refresh } = await tokenService.generateAuthTokens({
				userId: 3,
				roleId: 2,
			});
			const accessPayload = jwt.verify(access.token, config.jwt.secret);
			const refreshPayload = jwt.verify(refresh.token, config.jwt.secret);
			expect(accessPayload).toMatchObject({ userId: 3, roleId: 2 });
			expect(refreshPayload.userId).toBe(3);
			expect(refreshPayload).not.toHaveProperty('roleId');
		});

		it('expires the access token before the refresh token', async () => {
			const before = Date.now();
			const { access, refresh } = await tokenService.generateAuthTokens({
				userId: 1,
				roleId: 1,
			});
			expect(access.expires).toBeGreaterThanOrEqual(
				before + config.jwt.accessExpirationMinutes * 60 * 1000
			);
			expect(refresh.expires).toBeGreaterThan(access.expires);
		});
	});

	describe('generateResetPasswordToken', () => {
		it('returns a short-lived token carrying the user id', async () => {
			userService.getUserByEmail.mockResolvedValue({ id: 6 });
			const token = await tokenService.generateResetPasswordToken(
				'a@b.co'
			);
			const { id, exp } = jwt.verify(token, config.jwt.secret);
			expect(id).toBe(6);
			const minutesLeft = (exp * 1000 - Date.now()) / 60000;
			expect(minutesLeft).toBeLessThanOrEqual(
				config.jwt.resetPasswordExpirationMinutes
			);
			expect(minutesLeft).toBeGreaterThan(
				config.jwt.resetPasswordExpirationMinutes - 1
			);
		});

		it('throws 404 when no user has the email', async () => {
			userService.getUserByEmail.mockResolvedValue(null);
			await expect(
				tokenService.generateResetPasswordToken('ghost@b.co')
			).rejects.toMatchObject({ statusCode: 404 });
		});
	});
});
