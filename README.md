# Nodejs Express base API

** This is express base API buid with express**

## Getting Started

### Installation

Clone the repo:

```bash
git+ssh://git@gitlab.com/trungnq89/nodejs-api.git
cd nodejs-api
```

Install the dependencies:

```bash
yarn install
```

### Commands

Running locally:

```bash
yarn dev
```

Running in production:

```bash
#TODO
```

Testing:

```bash
#TODO
```

Linting:

```bash
# run ESLint
yarn lint

# fix ESLint errors
yarn lint:fix

# run prettier
yarn prettier

# fix prettier errors
yarn prettier:fix
```

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--controllers\    # Route controllers (controller layer)
 |--docs\           # Swagger files
 |--middlewares\    # Custom express middlewares
 |--models\         # Mongoose models (data layer)
 |--routes\         # Routes
 |--services\       # Business logic (service layer)
 |--utils\          # Utility classes and functions
 |--validations\    # Request data validation schemas
 |--app.js          # Express app
 |--index.js        # App entry point
```

## API Documentation

To view the list of available APIs and their specifications, run the server and go to `http://localhost:3000/v1/docs` in your browser. This documentation page is automatically generated using the [swagger](https://swagger.io/) definitions written as comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /v1/auth/register` - register\
`POST /v1/auth/login` - login\
`POST /v1/auth/logout` - logout\

**User routes**:\
`POST /v1/users` - create a user\
`GET /v1/users` - get all users\
`GET /v1/users/:userId` - get user\
`PATCH /v1/users/:userId` - update user\
`DELETE /v1/users/:userId` - delete user

## Error Handling

The app has a centralized error handling mechanism.

Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.

```javascript
const catchAsync = require('../utils/catchAsync');

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

```javascript
// user.service.js
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

async function findOneUserById(req, id) {
	const query = `SELECT * FROM "users" WHERE id = ${id} limit 1;`;
	const user = await generateQuery(req, query);

	if (!user || !user.rowCount) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return user.rows[0];
}
```

```javascript
// This function should be stored in src/utils folder
async function generateQuery(req, query) {
	const result = await req.postgres.query(query);
	return result;
}
```

## Validation

Request data is validated using [Joi](https://hapi.dev/family/joi/). Check the [documentation](https://hapi.dev/family/joi/api/) for more details on how to write Joi validation schemas.

The validation schemas are defined in the `src/validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

```javascript
const express = require('express');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router.post(
	'/users',
	validate(userValidation.createUser),
	userController.createUser
);
```

## Authentication

To require authentication for certain routes, you can use `jwt` function at `config` folder

```javascript
// app.js
const jwt = require('./config/jwt');

app.use(jwt());
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

## Authorization

The `auth` middleware is used to require certain rights/permissions to access a route.

```javascript
const express = require('express');
const { grantAccess } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

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

The permissions are role-based. You can view the permissions/rights of each role in the `src/config/roles.js` file.

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.

## Logging

Import the logger from `src/utils/logger.js`. It is using the [Winston](https://github.com/winstonjs/winston) logging library.

Logging should be done according to the following severity levels (ascending order from most important to least important):

```javascript
const logger = require('<path to src>/utils/logger');

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

- [ ] Update authentication flow to use refreshToken
- [ ] Rewrite README using this sample [template](https://github.com/talyssonoc/node-api-boilerplate) 
- [ ] Handle postgres with [Squelize](https://www.npmjs.com/package/sequelize)