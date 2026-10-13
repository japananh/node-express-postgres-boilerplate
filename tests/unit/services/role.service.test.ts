jest.mock('../../../src/db/models', () => ({
	Role: {
		findOne: jest.fn(),
		findAndCountAll: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	},
}));

import { Role } from '../../../src/db/models';
import * as roleService from '../../../src/services/role.service';

const mockRole = Role as unknown as Record<
	'findOne' | 'findAndCountAll' | 'create' | 'update' | 'destroy',
	jest.Mock
>;

// What Model.update({ returning: true }) resolves to: [count, instances].
const row = (values: object) => ({ get: () => values });

describe('role.service', () => {
	beforeEach(() => jest.resetAllMocks());

	it('getRoleById queries by id', async () => {
		mockRole.findOne.mockResolvedValue({ id: 3 });
		await expect(roleService.getRoleById(3)).resolves.toEqual({ id: 3 });
		expect(mockRole.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
	});

	describe('getRoles', () => {
		it('applies the default pagination', async () => {
			mockRole.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
			await roleService.getRoles({ query: {} });
			expect(mockRole.findAndCountAll).toHaveBeenCalledWith(
				expect.objectContaining({ limit: 10, offset: 0, raw: true })
			);
		});

		it('computes the offset from page and limit', async () => {
			mockRole.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
			await roleService.getRoles({ query: { page: 3, limit: 5 } });
			expect(mockRole.findAndCountAll).toHaveBeenCalledWith(
				expect.objectContaining({ limit: 5, offset: 10 })
			);
		});
	});

	describe('createRole', () => {
		it('creates a role with an empty default description', async () => {
			mockRole.findOne.mockResolvedValue(null);
			mockRole.create.mockResolvedValue({
				get: () => ({ id: 1, name: 'a' }),
			});
			await expect(
				roleService.createRole({ body: { name: 'a' } })
			).resolves.toEqual({
				id: 1,
				name: 'a',
			});
			expect(mockRole.create).toHaveBeenCalledWith({
				name: 'a',
				description: '',
			});
		});

		it('throws 409 when the name exists', async () => {
			mockRole.findOne.mockResolvedValue({ id: 1 });
			await expect(
				roleService.createRole({ body: { name: 'a' } })
			).rejects.toMatchObject({
				statusCode: 409,
			});
			expect(mockRole.create).not.toHaveBeenCalled();
		});
	});

	it('updateRole returns the updated row', async () => {
		mockRole.update.mockResolvedValue([1, [row({ id: 2, name: 'b' })]]);
		const req = { params: { roleId: '2' }, body: { name: 'b' } };
		await expect(roleService.updateRole(req)).resolves.toEqual({
			id: 2,
			name: 'b',
		});
		expect(mockRole.update).toHaveBeenCalledWith(
			{ name: 'b' },
			expect.objectContaining({ where: { id: '2' }, returning: true })
		);
	});

	it('updateRole returns undefined when no row matches', async () => {
		mockRole.update.mockResolvedValue([0, []]);
		const req = { params: { roleId: '9' }, body: { name: 'b' } };
		await expect(roleService.updateRole(req)).resolves.toBeUndefined();
	});

	describe('deleteRoleById', () => {
		it('returns the deleted count', async () => {
			mockRole.destroy.mockResolvedValue(1);
			await expect(roleService.deleteRoleById(2)).resolves.toBe(1);
			expect(mockRole.destroy).toHaveBeenCalledWith({ where: { id: 2 } });
		});

		it('throws 404 when nothing was deleted', async () => {
			mockRole.destroy.mockResolvedValue(0);
			await expect(roleService.deleteRoleById(2)).rejects.toMatchObject({
				statusCode: 404,
			});
		});
	});
});
