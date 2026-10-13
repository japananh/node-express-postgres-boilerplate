import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import config from '../../../src/config/config';
import {
	generateToken,
	generateExpires,
	verifyToken,
	encryptData,
	decryptData,
	setCookie,
} from '../../../src/utils/auth';

describe('auth utils', () => {
	describe('generateExpires', () => {
		it('returns a timestamp the given hours in the future', () => {
			const before = Date.now();
			const expires = generateExpires(2);
			expect(expires).toBeGreaterThanOrEqual(before + 2 * 3600 * 1000);
			expect(expires).toBeLessThanOrEqual(Date.now() + 2 * 3600 * 1000);
		});
	});

	describe('generateToken / verifyToken', () => {
		it('round-trips the payload', async () => {
			const token = generateToken({ userId: 7 }, generateExpires(1));
			const payload = await verifyToken(token);
			expect(payload.userId).toBe(7);
		});

		it('stores exp in seconds', () => {
			const expiresMs = generateExpires(1);
			const { exp } = jwt.decode(
				generateToken({}, expiresMs)
			) as jwt.JwtPayload;
			expect(exp).toBe(Math.floor(expiresMs / 1000));
		});

		it('rejects an expired token', async () => {
			const token = generateToken({ userId: 1 }, generateExpires(-1));
			await expect(verifyToken(token)).rejects.toThrow(/Invalid token/);
		});

		it('rejects a token signed with another secret', async () => {
			const token = generateToken(
				{ userId: 1 },
				generateExpires(1),
				'other'
			);
			await expect(verifyToken(token)).rejects.toThrow(/Invalid token/);
		});

		it('signs with the configured secret by default', () => {
			const token = generateToken({ a: 1 }, generateExpires(1));
			expect(() => jwt.verify(token, config.jwt.secret)).not.toThrow();
		});
	});

	describe('encryptData / decryptData', () => {
		it('hashes with a salt and verifies the original string', async () => {
			const first = await encryptData('password1');
			const second = await encryptData('password1');
			expect(first).not.toBe('password1');
			expect(first).not.toBe(second);
			await expect(decryptData('password1', first)).resolves.toBe(true);
		});

		it('does not verify a different string', async () => {
			const hash = await encryptData('password1');
			await expect(decryptData('password2', hash)).resolves.toBe(false);
		});
	});

	describe('setCookie', () => {
		it('sets an httpOnly cookie with the expiry', () => {
			const res = { cookie: jest.fn() };
			setCookie(res as unknown as Response, 'name', 'value', 1000);
			expect(res.cookie).toHaveBeenCalledWith('name', 'value', {
				httpOnly: true,
				expires: new Date(1000),
			});
		});
	});
});
