const httpStatus = require('http-status');
const { generateQuery } = require('../helpers/query');
const ApiError = require('../utils/ApiError');
const { encryptData } = require('../utils/auth');

async function findOneUserByEmail(req, email) {
	const query = `SELECT * FROM "user" WHERE email = '${email}' limit 1;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'User does not exist');
	}

	return user.rows[0];
}

async function findOneUserById(req, id) {
	const query = `SELECT * FROM "user" WHERE id = ${id} limit 1;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'User does not exist');
	}

	return user.rows[0];
}

async function createUser(req, { name, email, password }) {
	const hashedPassword = await encryptData(password);
	const query = `INSERT INTO "user" (name, email, password, role) VALUES ('${name}', '${email}', '${hashedPassword}', 'user') returning id;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Internal Server Error'
		);
	}

	return user.rows[0];
}

module.exports = {
	findOneUserByEmail,
	findOneUserById,
	createUser,
};
