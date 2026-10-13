const { password } = require('../../../src/validations/custom.validation');

describe('password validation', () => {
	const helpers = { message: jest.fn((msg) => msg) };

	beforeEach(() => helpers.message.mockClear());

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
