import jwt from 'jsonwebtoken';
import bycrypt from 'bcrypt';
import type { Response } from 'express';
import config from '../config/config';

function generateToken(
	data: Record<string, unknown>,
	expiresMs: number,
	secret: string = config.jwt.secret
) {
	const token = jwt.sign(
		{ exp: Math.floor(expiresMs / 1000), ...data },
		secret
	);
	return token;
}

async function verifyToken(token: string) {
	try {
		const payload = jwt.verify(token, config.jwt.secret);
		return payload as jwt.JwtPayload;
	} catch (err) {
		throw new Error(`Invalid token: ${err}`);
	}
}

async function encryptData(string: string) {
	const salt = await bycrypt.genSalt(10);
	const hashedString = await bycrypt.hash(string, salt);
	return hashedString;
}

async function decryptData(string: string, hashedString: string) {
	const isValid = await bycrypt.compare(string, hashedString);
	return isValid;
}

function setCookie(
	res: Response,
	cookieName: string,
	cookieValue: string,
	expiresMs: number
) {
	res.cookie(cookieName, cookieValue, {
		httpOnly: true,
		expires: new Date(expiresMs),
	});
}

function generateExpires(hours: number) {
	const ms = Math.floor(Date.now() + hours * 60 * 60 * 1000);
	return ms;
}

export {
	generateToken,
	generateExpires,
	verifyToken,
	encryptData,
	decryptData,
	setCookie,
};
