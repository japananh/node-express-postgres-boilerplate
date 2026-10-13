import path from 'path';
import { execFileSync } from 'child_process';

import './env';

const root = path.resolve(__dirname, '../..');
const sequelizeCli = path.join(root, 'node_modules/.bin/sequelize');

const run = (...args: string[]) =>
	execFileSync(sequelizeCli, args, { cwd: root, stdio: 'pipe' });

// Rebuild the schema from the real migrations so they are exercised on every run.
export default async () => {
	try {
		run('db:migrate:undo:all');
		run('db:migrate');
	} catch (error) {
		const { stderr, message } = error as Error & { stderr?: Buffer };
		throw new Error(
			`Could not migrate the test database (is it up? try "npm run test:db:up"):\n${
				stderr || message
			}`
		);
	}
};
