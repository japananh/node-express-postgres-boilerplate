jest.mock('../../../src/services/user.service');

const userService = require('../../../src/services/user.service');
const authService = require('../../../src/services/auth.service');
const {
	encryptData,
	generateToken,
	generateExpires,
} = require('../../../src/utils/auth');

describe('auth.service', () => {
	beforeEach(() => jest.resetAllMocks());

	describe('loginUserWithEmailAndPassword', () => {
		const req = (password) => ({ body: { email: 'a@b.co', password } });

		it('returns the user without the password hash', async () => {
			userService.getUserByEmail.mockResolvedValue({
				id: 1,
				email: 'a@b.co',
				password: await encryptData('password1'),
			});
			const user = await authService.loginUserWithEmailAndPassword(
				req('password1')
			);
			expect(user).toMatchObject({ id: 1, email: 'a@b.co' });
			expect(user).not.toHaveProperty('password');
		});

		it('throws 401 for a wrong password', async () => {
			userService.getUserByEmail.mockResolvedValue({
				id: 1,
				password: await encryptData('password1'),
			});
			await expect(
				authService.loginUserWithEmailAndPassword(req('nope1234'))
			).rejects.toMatchObject({ statusCode: 401 });
		});

		it('throws 401 (not a TypeError) for an unknown user', async () => {
			userService.getUserByEmail.mockResolvedValue(null);
			await expect(
				authService.loginUserWithEmailAndPassword(req('password1'))
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});

	describe('refreshAuth', () => {
		const refresh = (payload, ms = generateExpires(1)) =>
			generateToken(payload, ms);

		it('returns the user for a valid refresh token', async () => {
			userService.getUserById.mockResolvedValue({
				id: 4,
				password: 'hash',
			});
			const user = await authService.refreshAuth(refresh({ userId: 4 }));
			expect(userService.getUserById).toHaveBeenCalledWith(4);
			expect(user).toEqual({ id: 4 });
		});

		it('rejects a garbage token', async () => {
			await expect(
				authService.refreshAuth('garbage')
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it('rejects an expired token', async () => {
			await expect(
				authService.refreshAuth(
					refresh({ userId: 4 }, generateExpires(-1))
				)
			).rejects.toMatchObject({ statusCode: 401 });
		});

		it('rejects an access token (it carries roleId)', async () => {
			await expect(
				authService.refreshAuth(refresh({ userId: 4, roleId: 1 }))
			).rejects.toMatchObject({ statusCode: 401 });
			expect(userService.getUserById).not.toHaveBeenCalled();
		});

		it('rejects a reset-password token (no userId)', async () => {
			await expect(
				authService.refreshAuth(refresh({ id: 4 }))
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it('rejects when the user no longer exists', async () => {
			userService.getUserById.mockResolvedValue(null);
			await expect(
				authService.refreshAuth(refresh({ userId: 4 }))
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});
});
