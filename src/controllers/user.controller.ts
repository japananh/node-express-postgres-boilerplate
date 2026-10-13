import httpStatus from 'http-status';
import type { Request } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import { userService } from '../services';

interface PageQuery {
	page?: number;
	limit?: number;
}

const getUsers = catchAsync(
	async (
		req: Request<Record<string, string>, unknown, unknown, PageQuery>,
		res
	) => {
		const users = await userService.getUsers(req);
		res.send({ users });
	}
);

const getUser = catchAsync(async (req, res) => {
	const user = await userService.getUserById(req.params.userId);

	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	delete user.password;
	res.send({ user });
});

const deleteUser = catchAsync(async (req, res) => {
	await userService.deleteUserById(req.params.userId);
	res.send({ success: true });
});

const updateUser = catchAsync(
	async (
		req: Request<
			{ userId: string },
			unknown,
			{ email?: string; name?: string; password?: string }
		>,
		res
	) => {
		const user = await userService.updateUser(req);

		if (!user) {
			throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
		}

		delete user.password;
		res.send({ user });
	}
);

export { getUsers, getUser, updateUser, deleteUser };
