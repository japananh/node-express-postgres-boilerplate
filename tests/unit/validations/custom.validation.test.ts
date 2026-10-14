import type { CustomHelpers } from '@hapi/joi';
import {
	password,
	idParam,
	sortBy,
} from '../../../src/validations/custom.validation';

describe('password validation', () => {
	const message = jest.fn((msg: { custom: string }) => msg.custom);
	const helpers = { message } as unknown as CustomHelpers;

	beforeEach(() => message.mockClear());

	it('accepts letters and digits of at least 8 characters', () => {
		expect(password('password1', helpers)).toBe('password1');
	});

	it('rejects short passwords', () => {
		expect(password('abc123', helpers)).toBe(
			'password must be at least 8 characters'
		);
	});

	it.each(['onlyletters', '12345678'])('rejects %s', (value) => {
		expect(password(value, helpers)).toBe(
			'password must contain at least 1 letter and 1 number'
		);
	});
});

describe('idParam', () => {
	it.each(['1', 7, '2147483647'])('accepts %s', (value) => {
		expect(idParam.validate(value).error).toBeUndefined();
	});

	it.each(['abc', '0', '-1', '1.5', '2147483648', undefined])(
		'rejects %s',
		(value) => {
			expect(idParam.validate(value).error).toBeDefined();
		}
	);
});

describe('sortBy', () => {
	const schema = sortBy(['name', 'created_date_time']);

	it.each(['name:asc', 'name:desc', 'created_date_time:desc'])(
		'accepts %s',
		(value) => {
			expect(schema.validate(value).error).toBeUndefined();
		}
	);

	it.each([
		'password:asc',
		'name',
		'name:',
		'name:up',
		'name:ASC',
		'name:asc,name:desc',
		'name;drop:asc',
		'',
	])('rejects %p', (value) => {
		expect(schema.validate(value).error).toBeDefined();
	});

	it('names the allowed fields in the message', () => {
		expect(schema.validate('x:asc').error?.message).toContain(
			'name, created_date_time'
		);
	});
});
