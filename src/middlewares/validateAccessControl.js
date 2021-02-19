/* eslint-disable no-unused-vars */
const httpStatus = require('http-status');
const { roles } = require('../config/roles');
const ApiError = require('../utils/ApiError');

function grantAccess(action, resource) {
	return async (req, _res, next) => {
		try {
			// TODO: refactor it using RBAC
			// const permission = roles.can(req.user.roleId)[action](resource);
			// if (!permission.granted) {
			// 	throw new ApiError(
			// 		httpStatus.FORBIDDEN,
			// 		"You don't have enough permission to perform this action"
			// 	);
			// }
			next();
		} catch (error) {
			next(error);
		}
	};
}

module.exports = { grantAccess };
