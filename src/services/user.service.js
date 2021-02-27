const httpStatus = require('http-status');
const { getOffset } = require('../utils/query');
const ApiError = require('../utils/ApiError');
const { encryptData } = require('../utils/auth');
const config = require('../config/config.js');
const db = require('../db/models');
const roleService = require('./role.service');

async function getUserByEmail(email) {
	const user = await db.user.findOne({
		where: { email },
		include: [
			{
				model: db.role,
				require: true,
				attributes: ['id', 'name'],
			},
		],
		raw: true,
	});

	return user;
}

async function getUserById(id) {
	const user = await db.user.findOne({
		where: { id },
		include: [
			{
				model: db.role,
				require: true,
				attributes: ['id', 'name'],
			},
		],
		raw: true,
	});

	return user;
}

async function createUser(req) {
	const { email, name, password, roleId } = req.body;
	const hashedPassword = await encryptData(password);
	const user = await getUserByEmail(email);

	if (user) {
		throw new ApiError(httpStatus.CONFLICT, 'This email already exits');
	}

	const role = await roleService.getRoleById(roleId);

	if (!role) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}

	const createdUser = await db.user
		.create({
			name,
			email,
			role_id: roleId,
			password: hashedPassword,
		})
		.then((resultEntity) => resultEntity.get({ plain: true }));

	return createdUser;
}

async function getUsers(req) {
	const { page: defaultPage, limit: defaultLimit } = config.pagination;
	const { page = defaultPage, limit = defaultLimit } = req.query;

	const offset = getOffset(page, limit);

	const users = await db.user.findAndCountAll({
		order: [
			['name', 'ASC'],
			['created_date_time', 'DESC'],
			['modified_date_time', 'DESC'],
		],
		include: [
			{
				model: db.role,
				require: true,
				attributes: ['id', 'name'],
			},
		],
		attributes: [
			'id',
			'name',
			'email',
			'created_date_time',
			'modified_date_time',
		],
		offset,
		limit,
		raw: true,
	});

	return users;
}

async function deleteUserById(userId) {
	const deletedUser = await db.user.destroy({
		where: { id: userId },
	});

	if (!deletedUser) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return deletedUser;
}

async function updateUser(req) {
	const { password, email } = req.body;

	if (password) {
		const hashedPassword = await encryptData(password);

		if (!hashedPassword) {
			throw new ApiError(
				httpStatus.INTERNAL_SERVER_ERROR,
				'Internal Server Error'
			);
		}

		req.body.password = hashedPassword;
	}

	if (email) {
		const existedUser = await getUserByEmail(email);

		if (existedUser) {
			throw new ApiError(
				httpStatus.CONFLICT,
				'This email is already exist'
			);
		}
	}

	const updatedUser = await db.user
		.update(
			{ ...req.body },
			{
				where: { id: req.params.userId || req.body.id },
				returning: true,
				plain: true,
				raw: true,
			}
		)
		.then((data) => data[1]);

	return updatedUser;
}

module.exports = {
	getUserByEmail,
	getUserById,
	createUser,
	updateUser,
	getUsers,
	deleteUserById,
};
