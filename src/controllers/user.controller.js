const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const getUsers = catchAsync(async (req, res) => {
	const users = await userService.getUsers(req, req.query);
	res.send({ users });
});

const getUser = catchAsync(async (req, res) => {
	const user = await userService.getUserById(req.params.userId);
	delete user.password;
	res.send({ user });
});

const deleteUser = catchAsync(async (req, res) => {
	await userService.deleteUserById(req, req.params.userId);
	res.send({ success: true });
});

const updateUser = catchAsync(async (req, res) => {
	const user = await userService.updateUser(req, req.body);
	delete user.password;
	res.send({ user });
});

module.exports = {
	getUsers,
	getUser,
	updateUser,
	deleteUser,
};
