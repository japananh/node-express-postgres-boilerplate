import Joi from '@hapi/joi';
import { password, idParam, sortBy } from './custom.validation';

const userSortFields = [
	'id',
	'name',
	'email',
	'created_date_time',
	'modified_date_time',
] as const;

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
		sortBy: sortBy(userSortFields),
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
