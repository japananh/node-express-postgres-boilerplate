const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
	openapi: '3.0.0',
	info: {
		title: 'node-express-postgresql-boilerplate API documentation',
		version,
		license: {
			name: '',
			url: '',
		},
	},
	servers: [
		{
			url: `http://localhost:${config.port}/v1`,
		},
	],
};

module.exports = swaggerDef;
