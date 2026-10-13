const httpStatus = require('http-status');
const ApiError = require('../../../src/utils/ApiError');
const config = require('../../../src/config/config');
const logger = require('../../../src/config/logger');
const {
	errorConverter,
	errorHandler,
} = require('../../../src/middlewares/error');

describe('errorConverter', () => {
	it('passes an ApiError through untouched', () => {
		const error = new ApiError(404, 'nope');
		const next = jest.fn();
		errorConverter(error, {}, {}, next);
		expect(next).toHaveBeenCalledWith(error);
	});

	it('wraps a plain error as a non-operational 500', () => {
		const next = jest.fn();
		errorConverter(new Error('boom'), {}, {}, next);
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
			{},
			{},
			next
		);
		errorConverter(
			Object.assign(new Error('b'), { status: 401 }),
			{},
			{},
			next
		);
		expect(next.mock.calls[0][0].statusCode).toBe(418);
		expect(next.mock.calls[1][0].statusCode).toBe(401);
	});
});

describe('errorHandler', () => {
	const makeRes = () => {
		const res = { locals: {} };
		res.status = jest.fn().mockReturnValue(res);
		res.send = jest.fn().mockReturnValue(res);
		return res;
	};

	afterEach(() => {
		config.env = 'test';
	});

	it('responds with the status code and message', () => {
		const res = makeRes();
		errorHandler(new ApiError(404, 'Not found'), {}, res, jest.fn());
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
			{},
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
		errorHandler(new ApiError(400, 'bad input'), {}, res, jest.fn());
		expect(res.send).toHaveBeenCalledWith({
			code: 400,
			message: 'bad input',
		});
	});

	it('adds the stack in development', () => {
		config.env = 'development';
		const res = makeRes();
		jest.spyOn(logger, 'error').mockImplementation(() => {});
		errorHandler(new ApiError(400, 'bad'), {}, res, jest.fn());
		expect(res.send.mock.calls[0][0].stack).toEqual(expect.any(String));
		logger.error.mockRestore();
	});
});
