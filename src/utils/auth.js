const jwt = require('jsonwebtoken');
const bycrypt = require('bcrypt');
const config = require('../config/config');

function generateToken(data, expireHours = 24, secret = config.jwt.secret) {
	const expires = expireHours * 3600 * 1000;
	const token = jwt.sign(data, secret, { expiresIn: expires });
	return token;
}

async function verifyToken(token) {
	try {
		const payload = jwt.verify(token, config.jwt.secret);
		return payload;
	} catch (err) {
		throw new Error(`Invalid token: ${err}`);
	}
}

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
	encryptData,
	decryptData,
	setCookie,
};
