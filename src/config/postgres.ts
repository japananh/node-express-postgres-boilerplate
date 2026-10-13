import { Client } from 'pg';
import config from './config';
import logger from './logger';

const postgres = new Client(config.sqlDB);

postgres.connect().then(
	() => logger.info('Connect to postgress sucessfully'),
	() => {
		logger.error('Connect to postgress error');
		process.exit(1);
	}
);

export { postgres };
