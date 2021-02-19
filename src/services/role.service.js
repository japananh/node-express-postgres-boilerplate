const httpStatus = require('http-status');
const { generateQuery, getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const config = require('../config/config.js');

async function getRole(req, { roleId, roleName }) {
	const query = `SELECT * FROM "role" WHERE id = '${roleId}' OR name = '${roleName}' limit 1;`;
	const userRole = await generateQuery(req, query);

	if (!userRole.length) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}

	return userRole[0];
}

async function getRoles(req, queries) {
	let { page, limit } = config.pagination;
	let conditions = 'id IS NOT NULL';

	Object.keys(queries).forEach((key) => {
		switch (key) {
			case 'page':
				page = queries[key];
				break;
			case 'limit':
				limit = queries[key];
				break;
			case 'name':
				conditions += ` AND ${key} LIKE '%${queries[key]}%'`;
				break;
			default:
		}
	});

	if (queries.sortBy) {
		conditions += ` ORDER BY ${queries.sortBy}, created_date_time DESC, modified_date_time DESC`;
	} else {
		conditions += ` ORDER BY created_date_time DESC, modified_date_time DESC`;
	}

	const offset = getOffset(page, limit);
	const query = `
		SELECT * FROM "role" WHERE ${conditions} LIMIT ${limit} OFFSET ${offset};`;

	const roles = await generateQuery(req, query);

	return roles;
}

async function createRole(req) {
	const { name, description = '' } = req.body;
	const query = `INSERT INTO "role" (name, description) 
		VALUES ('${name}', '${description}' returning *;`;
	const userRole = await generateQuery(req, query);

	return userRole[0];
}

async function updateRole(req) {
	const set = [];
	Object.keys(req.body).forEach((key) => {
		const value = req.body[key];
		set.push(`${key} = '${value}'`);
	});

	const query = `UPDATE "role" SET ${set.join(' , ')} WHERE id = '${
		req.params.id
	}' RETURNING *;`;
	const userRole = await generateQuery(req, query);

	return { ...req.body, id: userRole[0].id };
}

module.exports = {
	getRole,
	getRoles,
	createRole,
	updateRole,
};
