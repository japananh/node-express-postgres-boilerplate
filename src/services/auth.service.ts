import httpStatus from 'http-status';
import * as userService from './user.service';
import ApiError from '../utils/ApiError';
import { decryptData, verifyToken } from '../utils/auth';

async function loginUserWithEmailAndPassword(req: {
	body: { email: string; password: string };
}) {
	const { email, password } = req.body;
	const user = await userService.getUserByEmail(email);
	const isPasswordMatch =
		user && (await decryptData(password, user.password!));

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
 */
async function refreshAuth(refreshToken: string) {
	let payload;
	try {
		payload = await verifyToken(refreshToken);
	} catch {
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

export { loginUserWithEmailAndPassword, refreshAuth };
