const httpStatus = require('http-status');
const { roles } = require('../config/roles');
const ApiError = require('../utils/ApiError');

function grantAccess(action, resource) {
	return async (req, _res, next) => {
		try {
			// TODO: refactor it using RBAC
			const permission = roles
				.can(JSON.stringify(req.user.roleId))
				[action](resource);
			// eslint-disable-next-line eqeqeq
			const isOwned = req.user.userId == req.params.userId;
			if (!permission.granted && !isOwned) {
				throw new ApiError(
					httpStatus.FORBIDDEN,
					"You don't have enough permission to perform this action"
				);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
}

module.exports = { grantAccess };
