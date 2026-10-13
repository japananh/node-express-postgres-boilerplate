import { expressjwt as expressJwt } from 'express-jwt';
import type { Request } from 'express';
import config from './config';

function jwt() {
	const { secret } = config.jwt;
	return expressJwt({
		secret,
		getToken: function fromHeaderOrQuerystring(req: Request) {
			const token = req.headers.authorization
				? req.headers.authorization.split(' ')[1]
				: (req.query.token as string | undefined);
			if (token) return token;
			return undefined;
		},
		algorithms: ['HS256'],
		// express-jwt >= 7 defaults to `req.auth`; the app reads `req.user`.
		requestProperty: 'user',
	}).unless({
		path: [
			// public routes that don't require authentication
			/\/v[1-9](\d)*\/(auth|docs)\/.*/,
		],
	});
}

export default jwt;
