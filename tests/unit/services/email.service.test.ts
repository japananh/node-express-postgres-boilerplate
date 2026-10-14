import * as emailService from '../../../src/services/email.service';
import config from '../../../src/config/config';

describe('email.service', () => {
	let sendMail: jest.SpyInstance;

	beforeEach(() => {
		sendMail = jest
			.spyOn(emailService.transport, 'sendMail')
			.mockResolvedValue({} as never);
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

	it('converts transport failures into an operational 503', async () => {
		sendMail.mockRejectedValue(
			Object.assign(new Error('getaddrinfo ENOTFOUND email-server'), {
				code: 'EDNS',
			})
		);
		await expect(
			emailService.sendEmail('a', 'b', 'c')
		).rejects.toMatchObject({
			statusCode: 503,
			isOperational: true,
			message: 'Email service unavailable',
		});
	});

	it('does not leak the transport error or the token', async () => {
		sendMail.mockRejectedValue(new Error('auth failed for secret-user'));
		const error = await emailService
			.sendResetPasswordEmail('a@b.co', 'tok123')
			.catch((e) => e);
		expect(error.message).toBe('Email service unavailable');
		expect(error.message).not.toContain('tok123');
	});
});
