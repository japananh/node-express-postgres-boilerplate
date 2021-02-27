const httpStatus = require('http-status');
const { getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const config = require('../config/config.js');
const db = require('../db/models');

async function getRoleById(roleId) {
	const role = await db.role.findOne({
		where: { id: roleId },
	});

	return role;
}

async function getRoleByName(name) {
	const role = await db.role.findOne({
		where: { name },
	});

	return role;
}

async function getRoles(req) {
	const { page: defaultPage, limit: defaultLimit } = config.pagination;
	const { page = defaultPage, limit = defaultLimit } = req.query;

	const offset = getOffset(page, limit);

	const roles = await db.role.findAndCountAll({
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

async function createRole(req) {
	const { name, description = '' } = req.body;
	const existedRole = await getRoleByName(name);

	if (existedRole) {
		throw new ApiError(httpStatus.CONFLICT, 'This role already exits');
	}

	const createdRole = await db.role
		.create({
			name,
			description,
		})
		.then((resultEntity) => resultEntity.get({ plain: true }));

	return createdRole;
}

async function updateRole(req) {
	const updatedRole = await db.role
		.update(
			{ ...req.body },
			{
				where: { id: req.params.roleId },
				returning: true,
				plain: true,
				raw: true,
			}
		)
		.then((data) => data[1]);

	return updatedRole;
}

module.exports = {
	getRoleById,
	getRoles,
	createRole,
	updateRole,
};
