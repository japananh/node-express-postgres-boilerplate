import config from '../config/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

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

export default swaggerDef;
