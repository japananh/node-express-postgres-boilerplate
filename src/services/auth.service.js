const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { decryptData } = require('../utils/auth');

/**
 * Login with user email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
async function loginUserWithEmailAndPassword(req, { email, password }) {
	const user = await userService.findOneUserByEmail(req, email);
	const isPasswordMatch = await decryptData(password, user.password);

	if (!user || !isPasswordMatch) {
		throw new ApiError(
			httpStatus.UNAUTHORIZED,
			'Invalid email or password'
		);
	}

	delete user.password;

	return user;
}

module.exports = {
	loginUserWithEmailAndPassword,
};
