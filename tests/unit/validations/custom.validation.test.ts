import type { CustomHelpers } from '@hapi/joi';
import { password } from '../../../src/validations/custom.validation';

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
