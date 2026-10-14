jest.mock('../../../src/db/models', () => ({
	Role: {
		findOne: jest.fn(),
		findAndCountAll: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	},
}));

import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
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

		it('orders by sortBy with an id tie-breaker', async () => {
			mockRole.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
			await roleService.getRoles({ query: { sortBy: 'name:desc' } });
			expect(mockRole.findAndCountAll).toHaveBeenCalledWith(
				expect.objectContaining({
					order: [
						['name', 'DESC'],
						['id', 'ASC'],
					],
				})
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

	describe('updateRole name conflicts', () => {
		const req = { params: { roleId: '2' }, body: { name: 'admin' } };

		it('throws 409 when another role has the name', async () => {
			mockRole.findOne.mockResolvedValue({ id: 1 });
			await expect(roleService.updateRole(req)).rejects.toMatchObject({
				statusCode: 409,
			});
			expect(mockRole.update).not.toHaveBeenCalled();
		});

		it('allows re-saving the same name on the same role', async () => {
			mockRole.findOne.mockResolvedValue({ id: 2 });
			mockRole.update.mockResolvedValue([1, [row({ id: 2 })]]);
			await expect(roleService.updateRole(req)).resolves.toEqual({
				id: 2,
			});
		});
	});

	describe('createRole race', () => {
		it('maps a unique violation to 409', async () => {
			mockRole.findOne.mockResolvedValue(null);
			mockRole.create.mockRejectedValue(new UniqueConstraintError({}));
			await expect(
				roleService.createRole({ body: { name: 'a' } })
			).rejects.toMatchObject({ statusCode: 409 });
		});
	});

	describe('deleteRoleById', () => {
		it('maps a foreign key violation to 409', async () => {
			mockRole.destroy.mockRejectedValue(
				new ForeignKeyConstraintError({})
			);
			await expect(roleService.deleteRoleById(2)).rejects.toMatchObject({
				statusCode: 409,
			});
		});

		it('rethrows other database errors', async () => {
			mockRole.destroy.mockRejectedValue(new Error('boom'));
			await expect(roleService.deleteRoleById(2)).rejects.toThrow('boom');
		});

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
