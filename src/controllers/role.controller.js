const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { roleService } = require('../services');

const createRole = catchAsync(async (req, res) => {
	const role = await roleService.createRole(req);
	res.send({ role });
});

const getRoles = catchAsync(async (req, res) => {
	const roles = await roleService.getRoles(req);
	res.send({ roles });
});

const getRole = catchAsync(async (req, res) => {
	const role = await roleService.getRoleById(req.params.roleId);
	if (!role) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}
	res.send({ role });
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
	createRole,
	getRoles,
	getRole,
	updateRole,
	deleteRole,
};
