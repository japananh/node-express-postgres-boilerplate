const httpStatus = require('http-status');
const userService = require('./user.service');
const tokenService = require('./token.service');
const ApiError = require('../utils/ApiError');

/**
 * Login with user email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
async function loginUserWithEmailAndPassword(req, { email, password }) {
	const user = await userService.getUserByEmail(req, email);
	const isPasswordMatch = await tokenService.decryptData(
		password,
		user.password
	);

	if (!user || !isPasswordMatch) {
		throw new ApiError(
			httpStatus.UNAUTHORIZED,
			'Invalid email or password'
		);
	}

	delete user.password;

	return user;
}

async function resetPassword(req) {
	const { id } = await tokenService.verifyToken(req.query.token);
	if (!id) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			'Cannot update your password'
		);
	}
	await userService.updateUser(req, { password: req.query.password, id });
}

module.exports = {
	loginUserWithEmailAndPassword,
	resetPassword,
};
