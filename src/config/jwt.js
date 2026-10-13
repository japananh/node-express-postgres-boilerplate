const { expressjwt: expressJwt } = require('express-jwt');
const config = require('./config.js');

function jwt() {
	const { secret } = config.jwt;
	return expressJwt({
		secret,
		getToken: function fromHeaderOrQuerystring(req) {
			const token = req.headers.authorization
				? req.headers.authorization.split(' ')[1]
				: req.query.token;
			if (token) return token;
			return null;
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

module.exports = jwt;
