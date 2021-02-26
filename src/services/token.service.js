const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { generateToken, generateExpires } = require('../utils/auth');

async function generateResetPasswordToken(email) {
	const user = await userService.getUserByEmail(email);
	if (!user || !user.id) {
		throw new ApiError(
			httpStatus.NOT_FOUND,
			'User not found with this email'
		);
	}

	const expiresMs = generateExpires(
		config.jwt.resetPasswordExpirationMinutes / 60
	);
	const resetPasswordToken = generateToken({ id: user.id }, expiresMs);

	return resetPasswordToken;
}

async function generateAuthTokens({ userId, roleId }) {
	const refreshTokenExpires = generateExpires(
		config.jwt.refreshExpirationDays * 24
	);

	const refreshToken = generateToken({ userId }, refreshTokenExpires);

	const accessTokenExpires = generateExpires(
		config.jwt.accessExpirationMinutes / 60
	);
	const accessToken = generateToken({ userId, roleId }, accessTokenExpires);

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

module.exports = {
	generateResetPasswordToken,
	generateAuthTokens,
};
