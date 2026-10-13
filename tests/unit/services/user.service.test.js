const mockUser = {
	findOne: jest.fn(),
	findAndCountAll: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
	destroy: jest.fn(),
};
const mockRole = { findOne: jest.fn() };

jest.mock('../../../src/db/models', () => ({ user: mockUser, role: mockRole }));

const userService = require('../../../src/services/user.service');
const { decryptData } = require('../../../src/utils/auth');

describe('user.service', () => {
	beforeEach(() => jest.resetAllMocks());

	it('getUserByEmail and getUserById query with the role included', async () => {
		mockUser.findOne.mockResolvedValue({ id: 1 });
		await userService.getUserByEmail('a@b.co');
		await userService.getUserById(1);
		expect(mockUser.findOne.mock.calls[0][0]).toMatchObject({
			where: { email: 'a@b.co' },
			raw: true,
		});
		expect(mockUser.findOne.mock.calls[1][0]).toMatchObject({
			where: { id: 1 },
			raw: true,
		});
	});

	describe('createUser', () => {
		const req = {
			body: {
				email: 'a@b.co',
				name: 'A',
				password: 'password1',
				roleId: 2,
			},
		};

		it('stores a hashed password and returns the plain row', async () => {
			mockUser.findOne.mockResolvedValue(null);
			mockRole.findOne.mockResolvedValue({ id: 2 });
			mockUser.create.mockImplementation(async (data) => ({
				get: () => ({ id: 1, ...data }),
			}));

			const user = await userService.createUser(req);

			expect(user).toMatchObject({
				email: 'a@b.co',
				name: 'A',
				role_id: 2,
			});
			expect(user.password).not.toBe('password1');
			await expect(decryptData('password1', user.password)).resolves.toBe(
				true
			);
		});

		it('throws 409 for an existing email', async () => {
			mockUser.findOne.mockResolvedValue({ id: 9 });
			await expect(userService.createUser(req)).rejects.toMatchObject({
				statusCode: 409,
			});
			expect(mockUser.create).not.toHaveBeenCalled();
		});

		it('throws 404 for an unknown role', async () => {
			mockUser.findOne.mockResolvedValue(null);
			mockRole.findOne.mockResolvedValue(null);
			await expect(userService.createUser(req)).rejects.toMatchObject({
				statusCode: 404,
			});
		});
	});

	describe('getUsers', () => {
		it('paginates and never selects the password', async () => {
			mockUser.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
			await userService.getUsers({ query: { page: 2, limit: 5 } });
			const options = mockUser.findAndCountAll.mock.calls[0][0];
			expect(options).toMatchObject({ offset: 5, limit: 5 });
			expect(options.attributes).not.toContain('password');
		});
	});

	describe('deleteUserById', () => {
		it('returns the deleted count', async () => {
			mockUser.destroy.mockResolvedValue(1);
			await expect(userService.deleteUserById(4)).resolves.toBe(1);
		});

		it('throws 404 when nothing was deleted', async () => {
			mockUser.destroy.mockResolvedValue(0);
			await expect(userService.deleteUserById(4)).rejects.toMatchObject({
				statusCode: 404,
			});
		});
	});

	describe('updateUser', () => {
		it('hashes the password before saving', async () => {
			mockUser.update.mockResolvedValue([1, { id: 3 }]);
			const req = {
				params: { userId: '3' },
				body: { password: 'password1' },
			};
			await userService.updateUser(req);
			const [values, options] = mockUser.update.mock.calls[0];
			expect(values.password).not.toBe('password1');
			expect(options.where).toEqual({ id: '3' });
		});

		it('targets body.id when there is no route param (reset-password)', async () => {
			mockUser.update.mockResolvedValue([1, { id: 8 }]);
			await userService.updateUser({
				params: {},
				body: { id: 8, name: 'x' },
			});
			expect(mockUser.update.mock.calls[0][1].where).toEqual({ id: 8 });
		});

		it('throws 409 when the new email is taken', async () => {
			mockUser.findOne.mockResolvedValue({ id: 2 });
			await expect(
				userService.updateUser({
					params: { userId: '3' },
					body: { email: 'a@b.co' },
				})
			).rejects.toMatchObject({ statusCode: 409 });
			expect(mockUser.update).not.toHaveBeenCalled();
		});

		it('returns the updated row', async () => {
			mockUser.update.mockResolvedValue([1, { id: 3, name: 'n' }]);
			await expect(
				userService.updateUser({
					params: { userId: '3' },
					body: { name: 'n' },
				})
			).resolves.toEqual({ id: 3, name: 'n' });
		});
	});
});
