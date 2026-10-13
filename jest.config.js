const shared = {
	testEnvironment: 'node',
	setupFiles: ['<rootDir>/tests/helpers/env.js'],
	setupFilesAfterEnv: ['<rootDir>/tests/helpers/setupAfterEnv.js'],
};

// Integration files share one database, so run jest with --runInBand.
module.exports = {
	collectCoverageFrom: [
		'src/**/*.js',
		'!src/index.js',
		'!src/db/migrations/**',
	],
	coverageDirectory: 'coverage',
	projects: [
		{
			...shared,
			displayName: 'unit',
			testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
		},
		{
			...shared,
			displayName: 'integration',
			testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
			globalSetup: '<rootDir>/tests/helpers/globalSetup.js',
		},
	],
};
