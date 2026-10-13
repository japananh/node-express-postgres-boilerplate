import { getOffset, generateQuery } from '../../../src/utils/query';
import config from '../../../src/config/config';

describe('getOffset', () => {
	it('computes the row offset for a page', () => {
		expect(getOffset(1, 10)).toBe(0);
		expect(getOffset(3, 10)).toBe(20);
		expect(getOffset(2, 25)).toBe(25);
	});

	it('falls back to the configured pagination', () => {
		expect(getOffset()).toBe(
			(config.pagination.page - 1) * config.pagination.limit
		);
	});
});

describe('generateQuery', () => {
	it('resolves with the rows of the query result', async () => {
		const req = {
			postgres: {
				query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
			},
		};
		await expect(generateQuery(req as never, 'SELECT 1')).resolves.toEqual([
			{ id: 1 },
		]);
		expect(req.postgres.query).toHaveBeenCalledWith('SELECT 1');
	});

	it('rethrows a failed query as an Error carrying the stack', async () => {
		const failure = new Error('boom');
		const req = {
			postgres: { query: jest.fn().mockRejectedValue(failure) },
		};
		await expect(generateQuery(req as never, 'SELECT 1')).rejects.toThrow(
			'boom'
		);
	});
});
