import httpStatus from 'http-status';
import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';

// nodemailer waits 2 minutes to connect by default; fail the request sooner.
const transport = nodemailer.createTransport({
	...config.email.smtp,
	connectionTimeout: 10_000,
	greetingTimeout: 10_000,
	socketTimeout: 20_000,
});

if (config.env !== 'test') {
	transport
		.verify()
		.then(() => logger.info('Connected to email server'))
		.catch(() =>
			logger.warn(
				'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
			)
		);
}

/**
 * Send an email
 */
const sendEmail = async (to: string, subject: string, text: string) => {
	const msg = { from: config.email.from, to, subject, text };
	try {
		await transport.sendMail(msg);
	} catch (error) {
		// DNS, connection, TLS and auth failures all mean the same to the caller.
		logger.warn(`Email send failed: ${(error as Error).message}`);
		throw new ApiError(
			httpStatus.SERVICE_UNAVAILABLE,
			'Email service unavailable'
		);
	}
};

/**
 * Send reset password email
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
	const subject = 'Reset password';
	// replace this url with the link to the reset password page of your front-end app
	const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
	const text = `Dear user,
    To reset your password, click on this link: ${resetPasswordUrl}
    If you did not request any password resets, then ignore this email. Your token will be expired in 24 hours.`;
	await sendEmail(to, subject, text);
};

export { transport, sendEmail, sendResetPasswordEmail };
