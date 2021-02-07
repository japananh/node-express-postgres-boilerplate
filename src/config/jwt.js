const expressJwt = require('express-jwt');
const config = require('./config.js');

async function isRevoked(_req, _payload, done) {
	done();
}

function jwt() {
	const { secret } = config.jwt;
	return expressJwt({
		secret,
		getToken: function fromHeaderOrQuerystring(req) {
			const { token } = req.cookies || {};
			if (token) return token;
			return null;
		},
		algorithms: ['HS256'],
		isRevoked,
	}).unless({
		path: [
			// public routes that don't require authentication
			/\/v[1-9](\d)*\/auth\/.*/,
			/\/v1\/docs\/.*/,
		],
	});
}

module.exports = jwt;
