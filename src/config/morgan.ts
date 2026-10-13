import morgan from 'morgan';
import type { Response } from 'express';
import config from './config';
import logger from './logger';

morgan.token(
	'message',
	(_req, res) => (res as Response).locals.errorMessage || ''
);

const getIpFormat = () =>
	config.env === 'production' ? ':remote-addr - ' : '';
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
	skip: (req, res) => res.statusCode >= 400,
	stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
	skip: (req, res) => res.statusCode < 400,
	stream: { write: (message) => logger.error(message.trim()) },
});

export { successHandler, errorHandler };
