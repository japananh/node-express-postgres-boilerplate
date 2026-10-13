import httpStatus from 'http-status';
import config from '../config/config';
import * as userService from './user.service';
import ApiError from '../utils/ApiError';
import { generateToken, generateExpires } from '../utils/auth';

async function generateResetPasswordToken(email: string) {
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

async function generateAuthTokens({
	userId,
	roleId,
}: {
	userId: number;
	roleId: number;
}) {
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

export { generateResetPasswordToken, generateAuthTokens };
