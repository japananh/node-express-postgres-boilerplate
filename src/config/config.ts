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

		SQL_USERNAME: Joi.string().description('sqldb username'),
		SQL_HOST: Joi.string().description('sqldb host'),
		SQL_PORT: Joi.number().description('sqldb port'),
		SQL_DATABASE_NAME: Joi.string().description('sqldb database name'),
		SQL_PASSWORD: Joi.string().description('sqldb password'),
		SQL_DIALECT: Joi.string()
			.default('postgres')
			.description('type of sqldb'),
		SQL_MAX_POOL: Joi.number()
			.default(10)
			.min(5)
			.description('sqldb max pool connection'),
		SQL_MIN_POOL: Joi.number()
			.default(0)
			.min(0)
			.description('sqldb min pool connection'),
		SQL_IDLE: Joi.number()
			.default(10000)
			.description('sqldb max pool idle time in miliseconds'),

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
	SQL_USERNAME?: string;
	SQL_HOST?: string;
	SQL_PORT?: number;
	SQL_DATABASE_NAME?: string;
	SQL_PASSWORD?: string;
	SQL_DIALECT: Dialect;
	SQL_MAX_POOL: number;
	SQL_MIN_POOL: number;
	SQL_IDLE: number;
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
		user: envVars.SQL_USERNAME,
		host: envVars.SQL_HOST,
		port: envVars.SQL_PORT,
		database: envVars.SQL_DATABASE_NAME,
		password: envVars.SQL_PASSWORD,
		dialect: envVars.SQL_DIALECT,
		pool: {
			max: envVars.SQL_MAX_POOL,
			min: envVars.SQL_MIN_POOL,
			idle: envVars.SQL_IDLE,
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
