const httpStatus = require('http-status');
const { generateQuery, getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const { encryptData } = require('../utils/auth');
const config = require('../config/config.js');

async function getUserByEmail(req, email) {
	const query = `SELECT u.*, r.name as role_name FROM "user" u
		INNER JOIN "role" r ON r.id = u.role_id
		WHERE u.email = '${email}' limit 1;`;
	const user = await generateQuery(req, query);

	if (!user.length) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user[0];
}

async function getUserById(req, id) {
	const query = `SELECT u.*, r.name as role_name FROM "user" u
		INNER JOIN "role" r ON r.id = u.role_id
		WHERE u.id = '${id}' limit 1;`;
	const user = await generateQuery(req, query);

	if (!user.length) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user[0];
}

async function createUser(req, { name, email, password, roleId }) {
	const hashedPassword = await encryptData(password);
	const query = `INSERT INTO "user" (name, email, password, role_id) 
		VALUES ('${name}', '${email}', '${hashedPassword}', '${roleId}') returning *;`;
	const user = await generateQuery(req, query);

	delete user[0].password;
	return user[0];
}

async function getUsers(req, queries) {
	let { page, limit } = config.pagination;
	let conditions = 'u.id IS NOT NULL';

	Object.keys(queries).forEach((key) => {
		switch (key) {
			case 'page':
				page = queries[key];
				break;
			case 'limit':
				limit = queries[key];
				break;
			case 'email':
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
		SELECT u.id, u.name, u.email, u.created_date_time, u.modified_date_time, r.name as role
		FROM "user" u
		INNER JOIN "role" r ON r.id = u.role_id
		WHERE ${conditions} LIMIT ${limit} OFFSET ${offset};`;

	const users = await generateQuery(req, query);

	return users;
}

async function deleteUserById(req, userId) {
	// eslint-disable-next-line eqeqeq
	if (req.user.id == userId) {
		throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
	}

	const user = await getUserById(req, userId);
	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	const query = `DELETE FROM "user" where id = '${userId}' returning id;`;
	const deletedUser = await generateQuery(req, query);

	return deletedUser[0];
}

async function updateUser(req, reqBody) {
	let hashedPassword = '';
	if (reqBody.password) {
		hashedPassword = await encryptData(reqBody.password);
	}
	if (!hashedPassword) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Internal Server Error'
		);
	}

	const set = [];
	Object.keys(reqBody).forEach((key) => {
		let value = reqBody[key];
		if (key === 'password') {
			value = hashedPassword;
		}
		set.push(`${key} = '${value}'`);
	});
	const query = `UPDATE "user" SET ${set.join(' , ')} WHERE id = '${
		req.params.userId || reqBody.id
	}' RETURNING *;`;
	const user = await generateQuery(req, query);

	return { ...reqBody, id: user[0].id };
}

async function getUserRole(req, { roleId, roleName }) {
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

	const userRoles = await generateQuery(req, query);

	return userRoles;
}

async function createUserRole(req, { name, description = '' }) {
	const query = `INSERT INTO "role" (name, description) 
		VALUES ('${name}', '${description}' returning *;`;
	const userRole = await generateQuery(req, query);

	return userRole[0];
}

async function updateUserRole(req) {
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
	getUserByEmail,
	getUserById,
	createUser,
	updateUser,
	getUsers,
	deleteUserById,
	getUserRole,
	getRoles,
	createUserRole,
	updateUserRole,
};
