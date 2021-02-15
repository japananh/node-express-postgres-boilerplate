const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { decryptData } = require('../utils/auth');
const { generateQuery } = require('../utils/query');
/**
 * Login with user email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
async function loginUserWithEmailAndPassword(req, { email, password }) {
	const user = await userService.getUserByEmail(req, email);
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

async function logout(req, refreshToken) {
	const accessToken = req.cookies.token;
	const query = `DELETE FROM token WHERE token = '${refreshToken}' or token = '${accessToken}';`;
	const tokens = await generateQuery(req, query);
	if (!tokens.rowCount) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
	}
}

module.exports = {
	loginUserWithEmailAndPassword,
	logout,
};
