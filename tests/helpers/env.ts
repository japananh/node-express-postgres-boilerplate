// Defaults match docker-compose.yml; CI overrides them through real env vars.
const defaults = {
	NODE_ENV: 'test',
	JWT_SECRET: 'test-secret',
	DB_USERNAME: 'test',
	DB_PASSWORD: 'test',
	DB_HOST: '127.0.0.1',
	DB_PORT: '54329',
	DB_NAME: 'test',
};

// NODE_ENV is forced: a dev shell with NODE_ENV=development would enable stack traces.
process.env.NODE_ENV = 'test';
Object.entries(defaults).forEach(([key, value]) => {
	if (process.env[key] === undefined) process.env[key] = value;
});

// Integration setup truncates tables, so never point it at a non-test database.
if (!/test/i.test(process.env.DB_NAME!)) {
	throw new Error(
		`Refusing to run tests against database "${process.env.DB_NAME}"`
	);
}
