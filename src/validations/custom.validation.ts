import Joi, { CustomHelpers } from '@hapi/joi';

const password = (value: string, helpers: CustomHelpers) => {
	if (value.length < 8) {
		return helpers.message({
			custom: 'password must be at least 8 characters',
		});
	}
	if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
		return helpers.message({
			custom: 'password must contain at least 1 letter and 1 number',
		});
	}
	return value;
};

// Bounded to Postgres `integer`; anything larger is a driver error, not a 404.
const idParam = Joi.number().integer().min(1).max(2147483647).required();

const sortBy = (fields: readonly string[]) =>
	Joi.string()
		.pattern(new RegExp(`^(${fields.join('|')}):(asc|desc)$`))
		.messages({
			'string.pattern.base': `sortBy must be in the form field:asc|desc, where field is one of ${fields.join(
				', '
			)}`,
		});

export { password, idParam, sortBy };
