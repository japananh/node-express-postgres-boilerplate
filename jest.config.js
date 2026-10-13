const shared = {
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
	},
	setupFiles: ['<rootDir>/tests/helpers/env.ts'],
	setupFilesAfterEnv: ['<rootDir>/tests/helpers/setupAfterEnv.ts'],
};

// Integration files share one database, so run jest with --runInBand.
module.exports = {
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
	coverageDirectory: 'coverage',
	projects: [
		{
			...shared,
			displayName: 'unit',
			testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
		},
		{
			...shared,
			displayName: 'integration',
			testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
			globalSetup: '<rootDir>/tests/helpers/globalSetup.ts',
		},
	],
};
