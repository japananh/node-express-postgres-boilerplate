const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { decryptData, verifyToken } = require('../utils/auth');

async function loginUserWithEmailAndPassword(req) {
	const { email, password } = req.body;
	const user = await userService.getUserByEmail(email);
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

/**
 * Validate a refresh token and return the user it belongs to
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
async function refreshAuth(refreshToken) {
	let payload;
	try {
		payload = await verifyToken(refreshToken);
	} catch (error) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
	}

	// Access and reset-password tokens share the secret; only refresh tokens
	// carry a bare userId, so anything else must not mint new tokens.
	if (!payload.userId || payload.roleId !== undefined) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
	}

	const user = await userService.getUserById(payload.userId);
	if (!user) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
	}

	delete user.password;

	return user;
}

module.exports = {
	loginUserWithEmailAndPassword,
	refreshAuth,
};
