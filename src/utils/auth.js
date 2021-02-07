const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

async function encryptData(string) {
	const salt = await bycrypt.genSalt(10);
	const hashedString = await bycrypt.hash(string, salt);
	return hashedString;
}

async function decryptData(string, hashedString) {
	const isValid = await bycrypt.compare(string, hashedString);
	return isValid;
}

function generateToken(data, expireHours = 24) {
	const expires = expireHours * 3600 * 1000;
	const token = jwt.sign(data, config.jwt.secret, { expiresIn: expires });
	return token;
}

function setCookie(res, cookieName, data, expireHours = 24) {
	const expires = expireHours * 3600 * 1000;
	const token = generateToken(data, expireHours);
	res.cookie(cookieName, token, {
		httpOnly: true,
		expires: new Date(Date.now() + expires),
	});
}

module.exports = {
	encryptData,
	decryptData,
	setCookie,
};
