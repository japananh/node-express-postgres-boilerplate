import httpStatus from 'http-status';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { getOffset, getSortOrder } from '../utils/query';
import ApiError from '../utils/ApiError';
import config from '../config/config';
import { Role } from '../db/models';

interface PageQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
}

interface RoleBody {
	name: string;
	description?: string;
}

async function getRoleById(roleId: number | string) {
	const role = await Role.findOne({
		where: { id: roleId },
	});

	return role;
}

async function getRoleByName(name: string) {
	const role = await Role.findOne({
		where: { name },
	});

	return role;
}

async function getRoles(req: { query: PageQuery }) {
	const { page: defaultPage, limit: defaultLimit } = config.pagination;
	const { page = defaultPage, limit = defaultLimit, sortBy } = req.query;

	const offset = getOffset(page, limit);

	const roles = await Role.findAndCountAll({
		order: sortBy
			? getSortOrder(sortBy)
			: [
					['name', 'ASC'],
					['created_date_time', 'DESC'],
					['modified_date_time', 'DESC'],
			  ],
		limit,
		offset,
		raw: true,
	});

	return roles;
}

async function createRole(req: { body: RoleBody }) {
	const { name, description = '' } = req.body;
	const existedRole = await getRoleByName(name);

	if (existedRole) {
		throw new ApiError(httpStatus.CONFLICT, 'This role already exits');
	}

	try {
		const created = await Role.create({ name, description });
		return created.get({ plain: true });
	} catch (error) {
		// Lost a race with a concurrent create of the same name.
		if (error instanceof UniqueConstraintError) {
			throw new ApiError(httpStatus.CONFLICT, 'This role already exits');
		}
		throw error;
	}
}

async function updateRole(req: {
	params: { roleId: number | string };
	body: Partial<RoleBody>;
}) {
	const { name } = req.body;
	if (name) {
		const sameName = await getRoleByName(name);
		if (sameName && String(sameName.id) !== String(req.params.roleId)) {
			throw new ApiError(httpStatus.CONFLICT, 'This role already exits');
		}
	}

	const [, rows] = await Role.update(
		{ ...req.body },
		{
			where: { id: req.params.roleId },
			returning: true,
		}
	);

	return rows[0]?.get({ plain: true });
}

async function deleteRoleById(roleId: number | string) {
	let deletedRole: number;
	try {
		deletedRole = await Role.destroy({
			where: { id: roleId },
		});
	} catch (error) {
		if (error instanceof ForeignKeyConstraintError) {
			throw new ApiError(
				httpStatus.CONFLICT,
				'This role is still assigned to users'
			);
		}
		throw error;
	}

	if (!deletedRole) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}

	return deletedRole;
}

export {
	getRoleById,
	getRoleByName,
	getRoles,
	createRole,
	updateRole,
	deleteRoleById,
};
