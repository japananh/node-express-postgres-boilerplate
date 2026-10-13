const {
	grantAccess,
} = require('../../../src/middlewares/validateAccessControl');
const { resources } = require('../../../src/config/roles');

const run = async (action, resource, user, params = {}) => {
	const next = jest.fn();
	await grantAccess(action, resource)({ user, params }, {}, next);
	return next.mock.calls[0][0];
};

describe('grantAccess', () => {
	const admin = { userId: 1, roleId: 1 };
	const regular = { userId: 5, roleId: 2 };

	it('lets an admin act on any user', async () => {
		expect(
			await run('readAny', resources.USERINFO, admin, { userId: '9' })
		).toBeUndefined();
		expect(await run('deleteAny', resources.ROLE, admin)).toBeUndefined();
	});

	it('downgrades *Any to *Own when the target is the caller', async () => {
		expect(
			await run('readAny', resources.USERINFO, regular, { userId: '5' })
		).toBeUndefined();
	});

	it('forbids a regular user from acting on someone else', async () => {
		const error = await run('readAny', resources.USERINFO, regular, {
			userId: '9',
		});
		expect(error.statusCode).toBe(403);
	});

	it('forbids a regular user from roles entirely', async () => {
		const error = await run('readAny', resources.ROLE, regular);
		expect(error.statusCode).toBe(403);
	});

	it('forwards an error when the caller has no user', async () => {
		const next = jest.fn();
		await grantAccess('readAny', resources.USERINFO)(
			{ params: {} },
			{},
			next
		);
		expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
	});
});
