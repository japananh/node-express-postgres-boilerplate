import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import { closeDb } from '../helpers/db';

describe('Swagger docs', () => {
	afterAll(closeDb);

	it('serves /v1/docs/ without a token', async () => {
		const res = await request(app).get('/v1/docs/').expect(httpStatus.OK);
		expect(res.headers['content-type']).toMatch(/html/);
		expect(res.text).toContain('swagger-ui');
	});

	// The static middleware redirects to the slash form; the point is that the
	// JWT guard does not answer 401 first.
	it('redirects /v1/docs to /v1/docs/ without a token', async () => {
		const res = await request(app).get('/v1/docs');
		expect(res.status).toBe(httpStatus.MOVED_PERMANENTLY);
		expect(res.headers.location).toBe('/v1/docs/');
		await request(app).get(res.headers.location).expect(httpStatus.OK);
	});

	it.each([
		'/v1/docs/swagger-ui.css',
		'/v1/docs/swagger-ui-bundle.js',
		'/v1/docs/swagger-ui-init.js',
	])('serves the asset %s without a token', async (url) => {
		await request(app).get(url).expect(httpStatus.OK);
	});

	it('still protects the other routes', async () => {
		await request(app).get('/v1/users').expect(httpStatus.UNAUTHORIZED);
		await request(app)
			.get('/v1/users/v1/docs')
			.expect(httpStatus.UNAUTHORIZED);
	});
});
