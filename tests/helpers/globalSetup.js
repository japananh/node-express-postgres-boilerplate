const path = require('path');
const { execFileSync } = require('child_process');

require('./env');

const root = path.resolve(__dirname, '../..');
const sequelizeCli = path.join(root, 'node_modules/.bin/sequelize');

const run = (...args) =>
	execFileSync(sequelizeCli, args, { cwd: root, stdio: 'pipe' });

// Rebuild the schema from the real migrations so they are exercised on every run.
module.exports = async () => {
	try {
		run('db:migrate:undo:all');
		run('db:migrate');
	} catch (error) {
		throw new Error(
			`Could not migrate the test database (is it up? try "npm run test:db:up"):\n${
				error.stderr || error.message
			}`
		);
	}
};
