import { db } from './db';
import { encryptData } from '../../src/utils/auth';
import { generateAuthTokens } from '../../src/services/token.service';

const ADMIN_ROLE_ID = 1;
const USER_ROLE_ID = 2;

let counter = 0;

async function createUser({
	roleId = USER_ROLE_ID,
	password = 'password1',
	...overrides
}: { roleId?: number; password?: string; [column: string]: unknown } = {}) {
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

const bearer = (tokens: { access: { token: string } }) =>
	`Bearer ${tokens.access.token}`;

export { ADMIN_ROLE_ID, USER_ROLE_ID, createUser, bearer };
