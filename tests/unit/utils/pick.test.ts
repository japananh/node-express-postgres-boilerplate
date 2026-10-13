import pick from '../../../src/utils/pick';

describe('pick', () => {
	it('returns only the requested own keys', () => {
		expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
	});

	it('skips keys that are missing', () => {
		expect(pick({ a: 1 }, ['a', 'z'])).toEqual({ a: 1 });
	});

	it('ignores inherited properties', () => {
		const obj = Object.create({ inherited: 1 });
		expect(pick(obj, ['inherited'])).toEqual({});
	});

	it('returns an empty object for a nullish source', () => {
		expect(pick(undefined, ['a'])).toEqual({});
		expect(pick(null, ['a'])).toEqual({});
	});
});
