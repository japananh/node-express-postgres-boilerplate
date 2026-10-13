// Defaults match docker-compose.yml; CI overrides them through real env vars.
const defaults = {
	NODE_ENV: 'test',
	JWT_SECRET: 'test-secret',
	SQL_USERNAME: 'test',
	SQL_PASSWORD: 'test',
	SQL_HOST: '127.0.0.1',
	SQL_PORT: '54329',
	SQL_DATABASE_NAME: 'test',
};

// NODE_ENV is forced: a dev shell with NODE_ENV=development would enable stack traces.
process.env.NODE_ENV = 'test';
Object.entries(defaults).forEach(([key, value]) => {
	if (process.env[key] === undefined) process.env[key] = value;
});

// Integration setup truncates tables, so never point it at a non-test database.
if (!/test/i.test(process.env.SQL_DATABASE_NAME!)) {
	throw new Error(
		`Refusing to run tests against database "${process.env.SQL_DATABASE_NAME}"`
	);
}
