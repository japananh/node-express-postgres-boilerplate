import httpStatus from 'http-status';
import type { Request } from 'express';
import catchAsync from '../utils/catchAsync';
import {
	authService,
	userService,
	emailService,
	tokenService,
} from '../services';
import ApiError from '../utils/ApiError';
import { verifyToken } from '../utils/auth';

interface RegisterBody {
	email: string;
	name: string;
	password: string;
}

const register = catchAsync(
	async (
		req: Request<Record<string, string>, unknown, RegisterBody>,
		res
	) => {
		const { email, name, password } = req.body;
		const user = await userService.registerUser({
			body: { email, name, password },
		});
		const tokens = await tokenService.generateAuthTokens({
			userId: user.id,
			roleId: user.role_id,
		});
		delete user.password;
		res.status(httpStatus.CREATED).send({ user, tokens });
	}
);

const login = catchAsync(
	async (
		req: Request<
			Record<string, string>,
			unknown,
			{ email: string; password: string }
		>,
		res
	) => {
		const user = await authService.loginUserWithEmailAndPassword(req);
		const tokens = await tokenService.generateAuthTokens({
			userId: user.id,
			roleId: user.role_id,
		});
		res.send({ user, tokens });
	}
);

const refreshTokens = catchAsync(
	async (
		req: Request<Record<string, string>, unknown, { refreshToken: string }>,
		res
	) => {
		const user = await authService.refreshAuth(req.body.refreshToken);
		const tokens = await tokenService.generateAuthTokens({
			userId: user.id,
			roleId: user.role_id,
		});
		res.send(tokens);
	}
);

const forgotPassword = catchAsync(
	async (
		req: Request<Record<string, string>, unknown, { email: string }>,
		res
	) => {
		const resetPasswordToken =
			await tokenService.generateResetPasswordToken(req.body.email);
		await emailService.sendResetPasswordEmail(
			req.body.email,
			resetPasswordToken
		);
		res.send({ success: true });
	}
);

const resetPassword = catchAsync(
	async (
		req: Request<
			Record<string, string>,
			unknown,
			{ password: string; id?: number },
			{ token: string }
		>,
		res
	) => {
		let payload;
		try {
			payload = await verifyToken(req.query.token);
		} catch {
			throw new ApiError(
				httpStatus.UNAUTHORIZED,
				'Password reset failed'
			);
		}
		// Reset tokens carry `id`; access/refresh tokens carry `userId` and must not reset passwords.
		if (!payload.id) {
			throw new ApiError(
				httpStatus.UNAUTHORIZED,
				'Password reset failed'
			);
		}
		req.body.id = payload.id;
		await userService.updateUser(req);
		res.send({ success: true });
	}
);

export { register, login, refreshTokens, forgotPassword, resetPassword };
