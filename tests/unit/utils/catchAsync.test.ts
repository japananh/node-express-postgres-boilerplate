import catchAsync from '../../../src/utils/catchAsync';

describe('catchAsync', () => {
	it('calls the handler and does not call next on success', async () => {
		const handler = jest.fn().mockResolvedValue(undefined);
		const next = jest.fn();
		catchAsync(handler)('req' as never, 'res' as never, next);
		await new Promise(setImmediate);
		expect(handler).toHaveBeenCalledWith('req', 'res', next);
		expect(next).not.toHaveBeenCalled();
	});

	it('forwards a rejection to next', async () => {
		const error = new Error('fail');
		const next = jest.fn();
		catchAsync(() => Promise.reject(error))({} as never, {} as never, next);
		await new Promise(setImmediate);
		expect(next).toHaveBeenCalledWith(error);
	});
});
