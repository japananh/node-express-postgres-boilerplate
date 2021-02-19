const catchAsync = require('../utils/catchAsync');
const { roleService } = require('../services');

const getRoles = catchAsync(async (req, res) => {
	const users = await roleService.getRoles(req);
	res.send({ users });
});

const getRole = catchAsync(async (req, res) => {
	const user = await roleService.getRoleById(req);
	res.send({ user });
});

const deleteRole = catchAsync(async (req, res) => {
	await roleService.deleteRoleById(req);
	res.send({ success: true });
});

const updateRole = catchAsync(async (req, res) => {
	const role = await roleService.updateRole(req);
	res.send({ role });
});

module.exports = {
	getRoles,
	getRole,
	updateRole,
	deleteRole,
};
