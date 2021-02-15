const httpStatus = require('http-status');
const { generateQuery, getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const { encryptData } = require('../utils/auth');
const config = require('../config/config.js');

async function getUserByEmail(req, email) {
	const query = `SELECT * FROM "user" WHERE email = '${email}' limit 1;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user.rows[0];
}

async function getUserById(req, id) {
	const query = `SELECT * FROM "user" WHERE id = ${id} limit 1;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user.rows[0];
}

async function createUser(req, { name, email, password }) {
	const hashedPassword = await encryptData(password);
	const query = `INSERT INTO "user" (name, email, password, role) 
		VALUES ('${name}', '${email}', '${hashedPassword}', 'user') returning id;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Internal Server Error'
		);
	}

	return user.rows[0];
}

async function getUsers(req, queries) {
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
		SELECT id, name, email, role, created_date_time, modified_date_time
		FROM "user" WHERE ${conditions} limit ${limit} offset ${offset};`;

	const users = await generateQuery(req, query);
	if (!users || !users.rowCount) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return users.rows;
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
	if (!deletedUser || !deletedUser.rowCount) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Internal Server Error'
		);
	}

	return deletedUser.rows[0];
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

	if (!user || !user.rowCount) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Internal Server Error'
		);
	}

	return { ...reqBody, id: user.rows[0].id };
}

module.exports = {
	getUserByEmail,
	getUserById,
	createUser,
	updateUser,
	getUsers,
	deleteUserById,
};
