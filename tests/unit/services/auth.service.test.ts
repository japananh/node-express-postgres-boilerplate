jest.mock('../../../src/services/user.service');

import * as userService from '../../../src/services/user.service';
import * as authService from '../../../src/services/auth.service';
import {
	encryptData,
	generateToken,
	generateExpires,
} from '../../../src/utils/auth';

const getUserByEmail = jest.mocked(userService.getUserByEmail);
const getUserById = jest.mocked(userService.getUserById);

describe('auth.service', () => {
	beforeEach(() => jest.resetAllMocks());

	describe('loginUserWithEmailAndPassword', () => {
		const req = (password: string) => ({
			body: { email: 'a@b.co', password },
		});

		it('returns the user without the password hash', async () => {
			getUserByEmail.mockResolvedValue({
				id: 1,
				email: 'a@b.co',
				password: await encryptData('password1'),
			} as never);
			const user = await authService.loginUserWithEmailAndPassword(
				req('password1')
			);
			expect(user).toMatchObject({ id: 1, email: 'a@b.co' });
			expect(user).not.toHaveProperty('password');
		});

		it('throws 401 for a wrong password', async () => {
			getUserByEmail.mockResolvedValue({
				id: 1,
				password: await encryptData('password1'),
			} as never);
			await expect(
				authService.loginUserWithEmailAndPassword(req('nope1234'))
			).rejects.toMatchObject({ statusCode: 401 });
		});

		it('throws 401 (not a TypeError) for an unknown user', async () => {
			getUserByEmail.mockResolvedValue(null);
			await expect(
				authService.loginUserWithEmailAndPassword(req('password1'))
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});

	describe('refreshAuth', () => {
		const refresh = (
			payload: Record<string, unknown>,
			ms = generateExpires(1)
		) => generateToken(payload, ms);

		it('returns the user for a valid refresh token', async () => {
			getUserById.mockResolvedValue({
				id: 4,
				password: 'hash',
			} as never);
			const user = await authService.refreshAuth(refresh({ userId: 4 }));
			expect(getUserById).toHaveBeenCalledWith(4);
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
			expect(getUserById).not.toHaveBeenCalled();
		});

		it('rejects a reset-password token (no userId)', async () => {
			await expect(
				authService.refreshAuth(refresh({ id: 4 }))
			).rejects.toMatchObject({
				statusCode: 401,
			});
		});

		it('rejects when the user no longer exists', async () => {
			getUserById.mockResolvedValue(null);
			await expect(
				authService.refreshAuth(refresh({ userId: 4 }))
			).rejects.toMatchObject({ statusCode: 401 });
		});
	});
});
