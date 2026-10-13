# Nodejs Express base API

This is a boilerplate application for building REST APIs in Node.js using TypeScript, Express and PostgreSQL.

## Getting Started

### Installation

1. Clone the repository with `https://github.com/japananh/node-express-postgres-boilerplate.git`
2. Install the dependencies with `yarn install` (click here if [you don't have Yarn installed](https://yarnpkg.com/getting-started/install)
3. Setup the database and the other settings in `.env` (see `.env.example`)
4. Use Node 26 (`.nvmrc`), then `yarn dev` for development or `yarn build && yarn start` for the compiled app

### Scripts

This boilerplate comes with a collection of npm scripts to make your life easier, you'll run them with `npm run <script name>` or `yarn <script name>`:

-   `dev`: Run the application in development mode (`tsx watch`, restarts on change)
-   `build`: Compile `src/` to `dist/` with `tsc` and copy the Swagger YAML
-   `start`: Run the compiled app (`node dist/index.js`); run `build` first
-   `typecheck`: Type-check `src/` and `tests/` without emitting
-   `lint`: Run ESLint (`@typescript-eslint` + Airbnb + Prettier)
-   `lint:fix`: Fix ESLint errors
-   `prettier`: Check formatting with Prettier
-   `test`: Run unit and integration tests (needs Postgres, see [Testing](#testing))
-   `test:unit`: Run unit tests only (no database needed)
-   `test:integration`: Run integration tests only
-   `test:coverage`: Run all tests with a coverage report in `coverage/`
-   `test:db:up` / `test:db:down`: Start / remove the throwaway test Postgres

## Testing

Tests use [Jest](https://jestjs.io/) and [supertest](https://github.com/ladjs/supertest).

-   `tests/unit`: services, utils, middlewares and validations; the database is mocked.
-   `tests/integration`: auth, user and role routes against a real Postgres. Before each run the schema is rebuilt from the Sequelize migrations, and before each test the tables are truncated and the seeders re-run.

```bash
yarn test:db:up      # Postgres 16 in Docker on localhost:54329 (user/password/db: test)
yarn test            # unit + integration
yarn test:coverage   # same, with coverage
yarn test:db:down    # remove the container and its data
```

The defaults in `tests/helpers/env.ts` match `docker-compose.yml`. To use another Postgres, set `SQL_HOST`, `SQL_PORT`, `SQL_USERNAME`, `SQL_PASSWORD` and `SQL_DATABASE_NAME`; the database name must contain `test`, because the suite truncates its tables. No `.env` file is needed. GitHub Actions runs lint and the full suite against a Postgres service (`.github/workflows/test.yml`).

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--controllers\    # Route controllers (controller layer)
 |--db\
  |--config\        # Configuration for database
  |--migrations\    # Database migrations (plain JS, run by sequelize-cli)
  |--models\        # Typed Sequelize models
  |--seeders\       # Seeders (plain JS, run by sequelize-cli)
 |--docs\           # Swagger files
 |--middlewares\    # Custom express middlewares
 |--routes\         # Routes
 |--services\       # Business logic (service layer)
 |--utils\          # Utility classes and functions
 |--validations\    # Request data validation schemas
 |--types\          # Type declarations (Express request augmentation)
 |--app.ts          # Express app
 |--index.ts        # App entry point
tests\
 |--unit\           # Unit tests (mocked database)
 |--integration\    # Route tests against a real Postgres
 |--helpers\        # Env defaults, DB setup, factories
```

## API Documentation

To view the list of available APIs and their specifications, run the server and go to `http://localhost:3000/v1/docs` in your browser. This documentation page is automatically generated using the [swagger](https://swagger.io/) definitions written as comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /v1/auth/register` - register\
`POST /v1/auth/login` - login\
`POST /v1/auth/refresh-tokens` - refresh auth tokens\
`POST /v1/auth/forgot-password` - forgot-password\
`POST /v1/auth/reset-password` - reset-password

**User routes**:\
`POST /v1/users` - create a user\
`GET /v1/users` - get all users\
`GET /v1/users/:userId` - get user\
`PATCH /v1/users/:userId` - update user\
`DELETE /v1/users/:userId` - delete user

**Role routes**:\
`POST /v1/roles` - create a role\
`GET /v1/roles` - get all roles\
`GET /v1/roles/:roleId` - get a role\
`PATCH /v1/roles/:roleId` - update a role\
`DELETE /v1/roles/:roleId` - delete a role

## Database

This app uses [Sequelize](https://sequelize.org/) - an **Object-Relational Mapper** to maps object syntax into Postgres database, and [Sequelize CLI](https://github.com/sequelize/cli) package to manage sequelize.

There are 2 ways to run `sequelize-cli`.

```bash
# Method 1: Use sequelize global
npm install -g sequelize-cli

sequelize db:migrate

# Method 2
node_modules/.bin/sequelize db:migrate
```

Migrations and seeders stay plain JavaScript because `sequelize-cli` cannot load TypeScript. For the same reason `src/db/config/database.js` reads the `SQL_*` variables itself instead of importing `src/config/config.ts`.

## Error Handling

The app has a centralized error handling mechanism.

Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.

```javascript
import catchAsync from '../utils/catchAsync';

const controller = catchAsync(async (req, res) => {
	// this error will be forwarded to the error handling middleware
	throw new Error('Something wrong happened');
});
```

The error handling middleware sends an error response, which has the following format:

```json
{
	"code": 404,
	"message": "Not found"
}
```

When running in development mode, the error response also contains the error stack.

The app has a utility ApiError class to which you can attach a response code and a message, and then throw it from anywhere (catchAsync will catch it).

For example, if you are trying to get a user from the DB who is not found, and you want to send a 404 error, the code should look something like:

```typescript
// user.controller.ts
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const getUser = catchAsync(async (req, res) => {
	const user = await userService.getUserById(req.params.userId);

	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	res.send({ user });
});
```

## Validation

Request data is validated using [Joi](https://hapi.dev/family/joi/). Check the [documentation](https://hapi.dev/family/joi/api/) for more details on how to write Joi validation schemas.

The validation schemas are defined in the `src/validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

```typescript
import express from 'express';
import validate from '../../middlewares/validate';
import * as userValidation from '../../validations/user.validation';
import * as userController from '../../controllers/user.controller';

const router = express.Router();

router.post(
	'/users',
	validate(userValidation.createUser),
	userController.createUser
);
```

## Authentication

To require authentication for certain routes, you can use `jwt` function at `config` folder

```typescript
// app.ts
import jwt from './config/jwt';

app.use(jwt());
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

## Authorization

The `auth` middleware is used to require certain rights/permissions to access a route.

```typescript
import express from 'express';
import { grantAccess } from '../../middlewares/validateAccessControl';
import validate from '../../middlewares/validate';
import * as userValidation from '../../validations/user.validation';
import * as userController from '../../controllers/user.controller';

const router = express.Router();

router
	.route('/')
	.get(
		grantAccess('readAny', 'user'),
		validate(userValidation.getUsers),
		userController.getUsers
	);
```

In the example above, an authenticated user can access this route only if that user has the `getUsers` permission.

The permissions are role-based. You can view the permissions/rights of each role in the `src/config/roles.ts` file.

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.

## Logging

Import the logger from `src/config/logger.ts`. It is using the [Winston](https://github.com/winstonjs/winston) logging library.

Logging should be done according to the following severity levels (ascending order from most important to least important):

```typescript
import logger from '<path to src>/config/logger';

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

In development mode, log messages of all severity levels will be printed to the console.

In production mode, only `info`, `warn`, and `error` logs will be printed to the console.\
It is up to the server (or process manager) to actually read them from the console and store them in log files.\
This app uses pm2 in production mode, which is already configured to store the logs in log files.

Note: API request information (request url, response code, timestamp, etc.) are also automatically logged (using [morgan](https://github.com/expressjs/morgan)).

## Inspirations

-   [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate)

## License

To be updated

## TODOs

-   [x] Update authentication flow to use refreshToken
-   [x] Rewrite README using this sample [template](https://github.com/talyssonoc/node-api-boilerplate)
-   [x] Handle postgres with [Squelize](https://www.npmjs.com/package/sequelize)
-   [x] Update CHANGELOG
-   [x] Add test
-   [x] Refactor code use Typescript
