import httpStatus from 'http-status';
import { getOffset } from '../utils/query';
import ApiError from '../utils/ApiError';
import config from '../config/config';
import { Role } from '../db/models';

interface PageQuery {
	page?: number;
	limit?: number;
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
	const { page = defaultPage, limit = defaultLimit } = req.query;

	const offset = getOffset(page, limit);

	const roles = await Role.findAndCountAll({
		order: [
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

	const createdRole = await Role.create({
		name,
		description,
	}).then((resultEntity) => resultEntity.get({ plain: true }));

	return createdRole;
}

async function updateRole(req: {
	params: { roleId: string };
	body: Partial<RoleBody>;
}) {
	const updatedRole = await Role.update(
		{ ...req.body },
		{
			where: { id: req.params.roleId },
			returning: true,
			// @ts-expect-error `plain`/`raw` are passed through to the query but not typed for update()
			plain: true,
			raw: true,
		}
	).then((data) => data[1] as unknown as Role | undefined);

	return updatedRole;
}

async function deleteRoleById(roleId: number | string) {
	const deletedRole = await Role.destroy({
		where: { id: roleId },
	});

	if (!deletedRole) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}

	return deletedRole;
}

export { getRoleById, getRoles, createRole, updateRole, deleteRoleById };
