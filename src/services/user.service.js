const httpStatus = require('http-status');
const { generateQuery, getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const { encryptData } = require('../utils/auth');
const config = require('../config/config.js');
const db = require('../models');

async function getUserByEmail(email) {
	const user = await db.user.findOne({
		where: { email },
		include: [
			{
				model: db.role,
				require: true,
				attributes: ['id', 'name'],
			},
		],
	});

	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user.dataValues;
}

async function getUserById(id) {
	const user = await db.user.findOne({
		where: { id },
		include: [
			{
				model: db.role,
				require: true,
				attributes: ['id', 'name'],
			},
		],
	});

	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user.dataValues;
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

module.exports = {
	getUserByEmail,
	getUserById,
	createUser,
	updateUser,
	getUsers,
	deleteUserById,
};
