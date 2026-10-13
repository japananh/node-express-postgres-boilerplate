import Joi from '@hapi/joi';
import { password, idParam } from './custom.validation';

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
		userId: idParam,
	}),
};

const updateUser = {
	params: Joi.object().keys({
		userId: idParam,
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
		userId: idParam,
	}),
};

export { createUser, getUsers, getUser, updateUser, deleteUser };
