const emailService = require('../../../src/services/email.service');
const config = require('../../../src/config/config');

describe('email.service', () => {
	let sendMail;

	beforeEach(() => {
		sendMail = jest
			.spyOn(emailService.transport, 'sendMail')
			.mockResolvedValue({});
	});

	afterEach(() => jest.restoreAllMocks());

	it('sendEmail uses the configured sender', async () => {
		await emailService.sendEmail('to@x.co', 'Hi', 'body');
		expect(sendMail).toHaveBeenCalledWith({
			from: config.email.from,
			to: 'to@x.co',
			subject: 'Hi',
			text: 'body',
		});
	});

	it('sendResetPasswordEmail embeds the token in the link', async () => {
		await emailService.sendResetPasswordEmail('to@x.co', 'tok123');
		const msg = sendMail.mock.calls[0][0];
		expect(msg.subject).toBe('Reset password');
		expect(msg.text).toContain('reset-password?token=tok123');
	});

	it('propagates transport failures', async () => {
		sendMail.mockRejectedValue(new Error('smtp down'));
		await expect(emailService.sendEmail('a', 'b', 'c')).rejects.toThrow(
			'smtp down'
		);
	});
});
