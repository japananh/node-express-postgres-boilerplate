const jwt = require('jsonwebtoken');
const bycrypt = require('bcrypt');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');

/**
 * Generate token
 * @param {Object} data
 * @param {Number} expireHours
 * @param {string} [secret]
 * @returns {string}
 */
function generateToken(data, expireHours = 24, secret = config.jwt.secret) {
	const expires = expireHours * 3600 * 1000;
	const token = jwt.sign(data, secret, { expiresIn: expires });
	return token;
}

/**
 * Verify token and return token data (or throw an error if it is not valid)
 * @param {string} token
 * @returns {object} data store in token
 */
const verifyToken = async (token) => {
	try {
		const payload = jwt.verify(token, config.jwt.secret);
		return payload;
	} catch (err) {
		throw new Error(`Invalid token: ${err}`);
	}
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
	const user = await userService.getUserByEmail(email);
	if (!user || !user.id) {
		throw new ApiError(
			httpStatus.NOT_FOUND,
			'No user found with this email'
		);
	}

	const expireHours = config.jwt.resetPasswordExpirationMinutes / 60;
	const resetPasswordToken = generateToken({ id: user.id }, expireHours);

	return resetPasswordToken;
};

async function encryptData(string) {
	const salt = await bycrypt.genSalt(10);
	const hashedString = await bycrypt.hash(string, salt);
	return hashedString;
}

async function decryptData(string, hashedString) {
	const isValid = await bycrypt.compare(string, hashedString);
	return isValid;
}

function setCookie(
	res,
	cookieName,
	data,
	expireHours = config.cookie.COOKIE_EXPIRATION_HOURS
) {
	const expires = expireHours * 3600 * 1000;
	const token = generateToken(data, expireHours);
	res.cookie(cookieName, token, {
		httpOnly: true,
		expires: new Date(Date.now() + expires),
	});
}

module.exports = {
	generateToken,
	verifyToken,
	generateResetPasswordToken,
	encryptData,
	decryptData,
	setCookie,
};
