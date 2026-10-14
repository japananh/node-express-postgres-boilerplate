import Joi from '@hapi/joi';
import { idParam, sortBy } from './custom.validation';

const roleSortFields = [
	'id',
	'name',
	'description',
	'created_date_time',
	'modified_date_time',
] as const;

const createRole = {
	body: Joi.object().keys({
		name: Joi.string().required(),
		description: Joi.string(),
	}),
};

const getRoles = {
	query: Joi.object().keys({
		sortBy: sortBy(roleSortFields),
		limit: Joi.number().min(1),
		page: Joi.number().min(1),
	}),
};

const getRole = {
	params: Joi.object().keys({
		roleId: idParam,
	}),
};

const updateRole = {
	params: Joi.object().keys({
		roleId: idParam,
	}),
	body: Joi.object()
		.keys({
			name: Joi.string(),
			description: Joi.string(),
		})
		.min(1),
};

const deleteRole = {
	params: Joi.object().keys({
		roleId: idParam,
	}),
};

export { createRole, getRoles, getRole, updateRole, deleteRole };
