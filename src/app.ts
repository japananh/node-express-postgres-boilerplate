import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import { postgres } from './config/postgres';
import config from './config/config';
import * as morgan from './config/morgan';
import jwt from './config/jwt';
import { authLimiter } from './middlewares/rateLimiter';
import routes from './routes/v1';
import { errorConverter, errorHandler } from './middlewares/error';
import ApiError from './utils/ApiError';

const app = express();

if (config.env !== 'test') {
	app.use(morgan.successHandler);
	app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

app.use(cookieParser());

// jwt authentication
app.use(jwt());

// connect to postgres database
app.use((req, _, next) => {
	req.postgres = postgres;
	next();
});

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
	app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
	next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
