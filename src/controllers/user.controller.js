const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { userService } = require('../services');

const getUsers = catchAsync(async (req, res) => {
	const users = await userService.getUsers(req);
	res.send({ users });
});

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

const updateUser = catchAsync(async (req, res) => {
	const user = await userService.updateUser(req);

	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	delete user.password;
	res.send({ user });
});

module.exports = {
	getUsers,
	getUser,
	updateUser,
	deleteUser,
};
