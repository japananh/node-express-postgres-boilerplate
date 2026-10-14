import httpStatus from 'http-status';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';

type HttpError = Error & { statusCode?: number; status?: number };

const errorConverter = (
	err: HttpError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	let error = err;
	// Auth failures are client errors; without this the production masking turns them into 500.
	if (error.name === 'UnauthorizedError') {
		error = new ApiError(
			httpStatus.UNAUTHORIZED,
			error.message,
			true,
			err.stack
		);
	} else if (!(error instanceof ApiError)) {
		// express-jwt errors expose `status`, not `statusCode`.
		const statusCode =
			error.statusCode ||
			error.status ||
			httpStatus.INTERNAL_SERVER_ERROR;
		const message =
			error.message ||
			(httpStatus as unknown as Record<number, string>)[statusCode];
		error = new ApiError(statusCode, message, false, err.stack);
	}
	next(error);
};

const errorHandler = (
	err: ApiError,
	req: Request,
	res: Response,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	next: NextFunction
) => {
	let { statusCode, message } = err;
	if (config.env === 'production' && !err.isOperational) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = (httpStatus as unknown as Record<number, string>)[
			httpStatus.INTERNAL_SERVER_ERROR
		];
	}

	res.locals.errorMessage = err.message;

	const response = {
		code: statusCode,
		message,
		...(config.env === 'development' && { stack: err.stack }),
	};

	if (config.env === 'development') {
		logger.error(err);
	}

	res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
