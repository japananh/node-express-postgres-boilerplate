import dotenv from 'dotenv';
import path from 'path';
import Joi from '@hapi/joi';
import type { Dialect } from 'sequelize';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
	.keys({
		NODE_ENV: Joi.string()
			.valid('production', 'development', 'test')
			.required(),
		PORT: Joi.number().default(3000),

		JWT_SECRET: Joi.string().required().description('JWT secret key'),
		JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
			.default(30)
			.description('minutes after which access tokens expire'),
		JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
			.default(30)
			.description('days after which refresh tokens expire'),

		COOKIE_EXPIRATION_HOURS: Joi.number()
			.default(24)
			.description('hours after which httpOnly cookie expire'),

		DB_USERNAME: Joi.string().description('database username'),
		DB_HOST: Joi.string().description('database host'),
		DB_PORT: Joi.number().description('database port'),
		DB_NAME: Joi.string().description('database database name'),
		DB_PASSWORD: Joi.string().description('database password'),
		DB_DIALECT: Joi.string()
			.default('postgres')
			.description('type of database'),
		DB_MAX_POOL: Joi.number()
			.default(10)
			.min(5)
			.description('database max pool connection'),
		DB_MIN_POOL: Joi.number()
			.default(0)
			.min(0)
			.description('database min pool connection'),
		DB_IDLE: Joi.number()
			.default(10000)
			.description('database max pool idle time in miliseconds'),

		SMTP_HOST: Joi.string().description('server that will send the emails'),
		SMTP_PORT: Joi.number().description(
			'port to connect to the email server'
		),
		SMTP_USERNAME: Joi.string().description('username for email server'),
		SMTP_PASSWORD: Joi.string().description('password for email server'),
		EMAIL_FROM: Joi.string().description(
			'the from field in the emails sent by the app'
		),
	})
	.unknown();

interface EnvVars {
	NODE_ENV: 'production' | 'development' | 'test';
	PORT: number;
	JWT_SECRET: string;
	JWT_ACCESS_EXPIRATION_MINUTES: number;
	JWT_REFRESH_EXPIRATION_DAYS: number;
	COOKIE_EXPIRATION_HOURS: number;
	DB_USERNAME?: string;
	DB_HOST?: string;
	DB_PORT?: number;
	DB_NAME?: string;
	DB_PASSWORD?: string;
	DB_DIALECT: Dialect;
	DB_MAX_POOL: number;
	DB_MIN_POOL: number;
	DB_IDLE: number;
	SMTP_HOST?: string;
	SMTP_PORT?: number;
	SMTP_USERNAME?: string;
	SMTP_PASSWORD?: string;
	EMAIL_FROM?: string;
}

const { value, error } = envVarsSchema
	.prefs({ errors: { label: 'key' } })
	.validate(process.env);
const envVars = value as EnvVars;

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

const config = {
	env: envVars.NODE_ENV,
	port: envVars.PORT,
	pagination: {
		limit: 10,
		page: 1,
	},
	jwt: {
		secret: envVars.JWT_SECRET,
		accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
		refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
		resetPasswordExpirationMinutes: 10,
	},
	cookie: {
		cookieExpirationHours: envVars.COOKIE_EXPIRATION_HOURS,
	},
	sqlDB: {
		user: envVars.DB_USERNAME,
		host: envVars.DB_HOST,
		port: envVars.DB_PORT,
		database: envVars.DB_NAME,
		password: envVars.DB_PASSWORD,
		dialect: envVars.DB_DIALECT,
		pool: {
			max: envVars.DB_MAX_POOL,
			min: envVars.DB_MIN_POOL,
			idle: envVars.DB_IDLE,
		},
		define: {
			/**
			 * All tables won't have "createdAt" and "updatedAt" Auto fields.
			 * References: https://sequelize.org/master/manual/model-basics.html#timestamps
			 */
			timestamps: false,
			// Table names won't be pluralized.
			freezeTableName: true,
			// Column names will be underscored.
			underscored: true,
		},
	},
	email: {
		smtp: {
			host: envVars.SMTP_HOST,
			port: envVars.SMTP_PORT,
			auth: {
				user: envVars.SMTP_USERNAME,
				pass: envVars.SMTP_PASSWORD,
			},
		},
		from: envVars.EMAIL_FROM,
	},
};

export default config;
