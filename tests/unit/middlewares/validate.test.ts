import Joi from '@hapi/joi';
import type { Request, Response } from 'express';
import validate from '../../../src/middlewares/validate';
import ApiError from '../../../src/utils/ApiError';

// Express hands over a full Request; these tests only need the validated parts.
const run = (
	schema: Parameters<typeof validate>[0],
	req: object,
	next: jest.Mock
) => validate(schema)(req as Request, {} as Response, next);

describe('validate middleware', () => {
	const schema = {
		body: Joi.object().keys({
			name: Joi.string().required(),
			age: Joi.number().default(18),
		}),
		query: Joi.object().keys({ page: Joi.number() }),
	};

	it('calls next without an error and applies Joi coercion and defaults', () => {
		const req = { body: { name: 'a' }, query: { page: '2' } };
		const next = jest.fn();
		run(schema, req, next);
		expect(next).toHaveBeenCalledWith();
		expect(req.body).toEqual({ name: 'a', age: 18 });
		expect((req.query as unknown as { page: number }).page).toBe(2);
	});

	it('passes a 400 ApiError with the failure message', () => {
		const next = jest.fn();
		run(schema, { body: {}, query: {} }, next);
		const error = next.mock.calls[0][0];
		expect(error).toBeInstanceOf(ApiError);
		expect(error.statusCode).toBe(400);
		expect(error.message).toContain('"name" is required');
	});

	it('validates query params too', () => {
		const next = jest.fn();
		run(schema, { body: { name: 'a' }, query: { page: 'x' } }, next);
		expect(next.mock.calls[0][0].message).toContain(
			'"page" must be a number'
		);
	});

	it('only validates the parts named in the schema', () => {
		const next = jest.fn();
		run(
			{ body: schema.body },
			{ body: { name: 'a' }, query: { anything: 1 } },
			next
		);
		expect(next).toHaveBeenCalledWith();
	});
});
