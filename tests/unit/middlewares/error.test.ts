import httpStatus from 'http-status';
import type { Request, Response } from 'express';
import ApiError from '../../../src/utils/ApiError';
import config from '../../../src/config/config';
import logger from '../../../src/config/logger';
import { errorConverter, errorHandler } from '../../../src/middlewares/error';

const req = {} as Request;
const noRes = {} as Response;

describe('errorConverter', () => {
	it('passes an ApiError through untouched', () => {
		const error = new ApiError(404, 'nope');
		const next = jest.fn();
		errorConverter(error, req, noRes, next);
		expect(next).toHaveBeenCalledWith(error);
	});

	it('wraps a plain error as a non-operational 500', () => {
		const next = jest.fn();
		errorConverter(new Error('boom'), req, noRes, next);
		const error = next.mock.calls[0][0];
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			statusCode: 500,
			message: 'boom',
			isOperational: false,
		});
	});

	it('honours statusCode and status (express-jwt uses status)', () => {
		const next = jest.fn();
		errorConverter(
			Object.assign(new Error('a'), { statusCode: 418 }),
			req,
			noRes,
			next
		);
		errorConverter(
			Object.assign(new Error('b'), { status: 401 }),
			req,
			noRes,
			next
		);
		expect(next.mock.calls[0][0].statusCode).toBe(418);
		expect(next.mock.calls[1][0].statusCode).toBe(401);
	});
});

describe('errorHandler', () => {
	const makeRes = () => {
		const res = { locals: {} as Record<string, unknown> } as Response & {
			status: jest.Mock;
			send: jest.Mock;
		};
		res.status = jest.fn().mockReturnValue(res);
		res.send = jest.fn().mockReturnValue(res);
		return res;
	};

	afterEach(() => {
		config.env = 'test';
	});

	it('responds with the status code and message', () => {
		const res = makeRes();
		errorHandler(new ApiError(404, 'Not found'), req, res, jest.fn());
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.send).toHaveBeenCalledWith({
			code: 404,
			message: 'Not found',
		});
		expect(res.locals.errorMessage).toBe('Not found');
	});

	it('hides non-operational error details in production', () => {
		config.env = 'production';
		const res = makeRes();
		errorHandler(
			new ApiError(500, 'db password leaked', false),
			req,
			res,
			jest.fn()
		);
		expect(res.send).toHaveBeenCalledWith({
			code: httpStatus.INTERNAL_SERVER_ERROR,
			message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
		});
	});

	it('keeps operational messages in production', () => {
		config.env = 'production';
		const res = makeRes();
		errorHandler(new ApiError(400, 'bad input'), req, res, jest.fn());
		expect(res.send).toHaveBeenCalledWith({
			code: 400,
			message: 'bad input',
		});
	});

	it('adds the stack in development', () => {
		config.env = 'development';
		const res = makeRes();
		const loggerError = jest
			.spyOn(logger, 'error')
			.mockImplementation((() => {}) as never);
		errorHandler(new ApiError(400, 'bad'), req, res, jest.fn());
		expect(res.send.mock.calls[0][0].stack).toEqual(expect.any(String));
		loggerError.mockRestore();
	});
});
