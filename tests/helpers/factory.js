const { db } = require('./db');
const { encryptData } = require('../../src/utils/auth');
const { generateAuthTokens } = require('../../src/services/token.service');

const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

let counter = 0;

// Role 1 (admin) is seeded; role 2 ("user") is what config/roles.js grants
// own-only access to. No explicit id: that would leave the sequence behind.
async function ensureUserRole() {
	const role = await db.role.create({
		name: 'user',
		description: 'regular user',
	});
	if (role.id !== USER_ROLE_ID) {
		throw new Error(`expected role id ${USER_ROLE_ID}, got ${role.id}`);
	}
}

async function createUser({
	roleId = USER_ROLE_ID,
	password = 'password1',
	...overrides
} = {}) {
	counter += 1;
	const user = await db.user.create({
		name: `User ${counter}`,
		email: `user${counter}@example.com`,
		role_id: roleId,
		password: await encryptData(password),
		...overrides,
	});
	const plain = user.get({ plain: true });
	const tokens = await generateAuthTokens({
		userId: plain.id,
		roleId: plain.role_id,
	});
	return { user: plain, password, tokens };
}

const bearer = (tokens) => `Bearer ${tokens.access.token}`;

module.exports = {
	ADMIN_ROLE_ID,
	USER_ROLE_ID,
	ensureUserRole,
	createUser,
	bearer,
};
