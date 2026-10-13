const ApiError = require('../../../src/utils/ApiError');

describe('ApiError', () => {
	it('is an Error carrying a status code and is operational by default', () => {
		const error = new ApiError(404, 'Not found');
		expect(error).toBeInstanceOf(Error);
		expect(error).toMatchObject({
			statusCode: 404,
			message: 'Not found',
			isOperational: true,
		});
		expect(error.stack).toEqual(expect.any(String));
	});

	it('keeps a provided stack and operational flag', () => {
		const error = new ApiError(500, 'x', false, 'custom stack');
		expect(error.isOperational).toBe(false);
		expect(error.stack).toBe('custom stack');
	});
});
