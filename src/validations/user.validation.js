const Joi = require('@hapi/joi');
const { password } = require('./custom.validation');

const createUser = {
	body: Joi.object().keys({
		email: Joi.string().required().email(),
		password: Joi.string().required().custom(password),
		name: Joi.string().required(),
		roleId: Joi.number().required(),
	}),
};

const getUsers = {
	query: Joi.object().keys({
		name: Joi.string(),
		email: Joi.string().email(),
		roleId: Joi.number(),
		limit: Joi.number().min(1),
		page: Joi.number().min(1),
	}),
};

const getUser = {
	params: Joi.object().keys({
		userId: Joi.string(),
	}),
};

const updateUser = {
	params: Joi.object().keys({
		userId: Joi.required(),
	}),
	body: Joi.object()
		.keys({
			email: Joi.string().email(),
			password: Joi.string().custom(password),
			name: Joi.string(),
		})
		.min(1),
};

const deleteUser = {
	params: Joi.object().keys({
		userId: Joi.string(),
	}),
};

module.exports = {
	createUser,
	getUsers,
	getUser,
	updateUser,
	deleteUser,
};
