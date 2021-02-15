const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { generateToken, generateExpires } = require('../utils/auth');
const { generateQuery } = require('../utils/query');

async function generateResetPasswordToken(req, email) {
	const user = await userService.getUserByEmail(req, email);
	if (!user || !user.id) {
		throw new ApiError(
			httpStatus.NOT_FOUND,
			'No user found with this email'
		);
	}

	const expiresMs = generateExpires(
		config.jwt.resetPasswordExpirationMinutes / 60
	);
	const resetPasswordToken = generateToken({ id: user.id }, expiresMs);

	return resetPasswordToken;
}

async function saveToken(req, token, userId, tokenType) {
	const query = `INSERT INTO token (token, user_id, type) 
		VALUES ('${token}', ${userId}, '${tokenType}');`;
	await generateQuery(req, query);
}

async function generateAuthTokens(req, { userId, role }) {
	const refreshTokenExpires = generateExpires(
		config.jwt.refreshExpirationDays * 24
	);

	const refreshToken = generateToken({}, refreshTokenExpires);

	const accessTokenExpires = generateExpires(
		config.jwt.accessExpirationMinutes / 60
	);
	const accessToken = generateToken({ role }, accessTokenExpires);

	await saveToken(req, refreshToken, userId, 'refresh');
	await saveToken(req, accessToken, userId, 'access');

	return {
		refresh: {
			token: refreshToken,
			expires: refreshTokenExpires,
		},
		access: {
			token: accessToken,
			expires: accessTokenExpires,
		},
	};
}

async function deleteAllTokens(req, userId) {
	const query = `DELETE FROM token where user_id = '${userId}';`;
	await generateQuery(req, query);
}

module.exports = {
	generateResetPasswordToken,
	generateAuthTokens,
	deleteAllTokens,
};
