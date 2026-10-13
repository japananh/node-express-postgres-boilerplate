import express from 'express';
import request from 'supertest';

describe('authLimiter', () => {
	// A fresh module per test gives a fresh in-memory hit counter.
	const buildApp = () => {
		let app: express.Express | undefined;
		jest.isolateModules(() => {
			const limiterPath = '../../../src/middlewares/rateLimiter';
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const { authLimiter } = require(limiterPath);
			app = express();
			app.use(authLimiter);
			app.get('/ok', (req, res) => res.sendStatus(200));
			app.get('/fail', (req, res) => res.sendStatus(401));
		});
		return app as express.Express;
	};

	it('blocks after 20 failed requests', async () => {
		const app = buildApp();
		for (let i = 0; i < 20; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await request(app).get('/fail').expect(401);
		}
		await request(app).get('/fail').expect(429);
	});

	// skipSuccessfulRequests: normal use is never throttled, only failures count.
	it('never counts successful requests', async () => {
		const app = buildApp();
		for (let i = 0; i < 25; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await request(app).get('/ok').expect(200);
		}
	});
});
