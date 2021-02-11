const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { generateToken } = require('../utils/auth');

async function generateResetPasswordToken(req, email) {
	const user = await userService.getUserByEmail(req, email);
	if (!user || !user.id) {
		throw new ApiError(
			httpStatus.NOT_FOUND,
			'No user found with this email'
		);
	}

	const expireHours = config.jwt.resetPasswordExpirationMinutes / 60;
	const resetPasswordToken = generateToken({ id: user.id }, expireHours);

	return resetPasswordToken;
}

module.exports = {
	generateResetPasswordToken,
};
