# Node Express Postgres Boilerplate

REST API template in TypeScript with Express, Sequelize and PostgreSQL. It ships JWT authentication, role-based access control, Joi validation, Swagger docs and a Jest test suite, for developers starting a new Node.js API.

[![Test](https://github.com/japananh/node-express-postgres-boilerplate/actions/workflows/test.yml/badge.svg)](https://github.com/japananh/node-express-postgres-boilerplate/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node 26](https://img.shields.io/badge/node-%3E%3D26-339933.svg)](.nvmrc)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](tsconfig.json)

## Contents

- [Use this template](#use-this-template)
- [Run it locally](#run-it-locally)
- [Test](#test)
- [Build and start](#build-and-start)
- [Environment variables](#environment-variables)
- [API endpoints](#api-endpoints)
- [Project structure](#project-structure)
- [Database](#database)
- [Using with AI coding agents](#using-with-ai-coding-agents)
- [License](#license)

## Use this template

Click **Use this template** at the top of the [repository page](https://github.com/japananh/node-express-postgres-boilerplate), or from the terminal:

```bash
gh repo create my-api --template japananh/node-express-postgres-boilerplate --clone
cd my-api
```

## Run it locally

Requires Node 26 (`.nvmrc`), [Yarn 1](https://yarnpkg.com/getting-started/install) and a PostgreSQL server you run yourself. `docker-compose.yml` only provides the throwaway test database.

Install and configure:

```bash
yarn install
cp .env.example .env
```

Edit `.env` so the `DB_*` values point at your database, then create the schema and demo data:

```bash
node_modules/.bin/sequelize db:migrate
node_modules/.bin/sequelize db:seed:all
```

Start the dev server (restarts on change):

```bash
yarn dev
```

The API listens on `http://localhost:3000`. Swagger UI is at `http://localhost:3000/v1/docs`.

### Demo credentials

`db:seed:all` creates an admin and the `admin` and `user` roles:

| Email | Password | Role |
|---|---|---|
| `example@example.com` | `password1` | admin |

> **Warning:** these credentials are public. Change the password or delete the account (`node_modules/.bin/sequelize db:seed:undo --seed 20210227144500-demo-user.js`) before any production use.

## Test

Unit tests need no database:

```bash
yarn test:unit
```

The full suite needs the test Postgres (Docker, `localhost:54329`, user, password and database all `test`):

```bash
yarn test:db:up
yarn test
yarn test:db:down
```

Static checks:

```bash
yarn typecheck
yarn lint
```

`yarn test:coverage` writes a report to `coverage/`. Before each integration run the schema is rebuilt from the migrations, and before each test the tables are truncated and the seeders re-run. The suite refuses to run when `DB_NAME` does not contain `test`. To use another Postgres, set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` and `DB_NAME`; no `.env` file is needed. GitHub Actions runs typecheck, lint and the coverage run against a Postgres service (`.github/workflows/test.yml`).

## Build and start

```bash
yarn build
yarn start
```

`build` compiles `src/` to `dist/` with `tsc` and copies the Swagger YAML; `start` runs `node dist/index.js`.

## Environment variables

Read and validated in `src/config/config.ts`; the app throws at startup if validation fails. Template: `.env.example`.

| Name | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | yes | none | `development`, `production` or `test` |
| `PORT` | no | `3000` | HTTP port |
| `JWT_SECRET` | yes | none | Secret used to sign tokens |
| `JWT_ACCESS_EXPIRATION_MINUTES` | no | `30` | Access token lifetime |
| `JWT_REFRESH_EXPIRATION_DAYS` | no | `30` | Refresh token lifetime |
| `COOKIE_EXPIRATION_HOURS` | no | `24` | Lifetime of the httpOnly cookie |
| `DB_USERNAME` | no | none | Database user |
| `DB_HOST` | no | none | Database host |
| `DB_PORT` | no | none | Database port |
| `DB_NAME` | no | none | Database name |
| `DB_PASSWORD` | no | none | Database password |
| `DB_DIALECT` | no | `postgres` | Sequelize dialect |
| `DB_MAX_POOL` | no | `10` | Maximum pool connections (minimum 5) |
| `DB_MIN_POOL` | no | `0` | Minimum pool connections |
| `DB_IDLE` | no | `10000` | Pool idle time in milliseconds |
| `SMTP_HOST` | no | none | Mail server for password-reset emails |
| `SMTP_PORT` | no | none | Mail server port |
| `SMTP_USERNAME` | no | none | Mail server user |
| `SMTP_PASSWORD` | no | none | Mail server password |
| `EMAIL_FROM` | no | none | From address of sent emails |

The `DB_*` variables are optional in the schema but needed to connect to a database. They are also read by `sequelize-cli`.

## API endpoints

All routes are under `/v1`. Send `Authorization: Bearer <access token>` on protected routes. Full request and response schemas are in Swagger UI at `/v1/docs`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | public | Register a user (always gets the `user` role) |
| POST | `/v1/auth/login` | public | Log in |
| POST | `/v1/auth/refresh-tokens` | public | Refresh auth tokens |
| POST | `/v1/auth/forgot-password` | public | Send a password-reset email |
| POST | `/v1/auth/reset-password` | public | Reset the password |
| POST | `/v1/users` | admin | Create a user with any role (`roleId`) |
| GET | `/v1/users` | admin | List users |
| GET | `/v1/users/:userId` | admin, or the user themself | Get a user |
| PATCH | `/v1/users/:userId` | admin, or the user themself | Update a user |
| DELETE | `/v1/users/:userId` | admin, or the user themself | Delete a user |
| POST | `/v1/roles` | admin | Create a role |
| GET | `/v1/roles` | admin | List roles |
| GET | `/v1/roles/:roleId` | admin | Get a role |
| PATCH | `/v1/roles/:roleId` | admin | Update a role |
| DELETE | `/v1/roles/:roleId` | admin | Delete a role |

Roles and their permissions are defined in `src/config/roles.ts` (role id 1 is admin, 2 is user). Public registration never accepts a role: a `roleId` in the body is rejected with 400 and the new account gets the role named `user`, so the seeders must have run (otherwise registration fails with a 500 that says so). Only an admin can assign another role, through `POST /v1/users`. List endpoints accept `page`, `limit` and `sortBy` (`field:asc` or `field:desc`).

## Project structure

```text
src/
  config/        validated env, JWT, logger, RBAC grants
  controllers/   HTTP handlers
  db/
    config/      sequelize-cli connection (JS)
    migrations/  schema migrations (JS)
    models/      typed Sequelize models
    seeders/     demo data (JS)
  docs/          Swagger definition and shared components
  middlewares/   validate, access control, errors, rate limiter
  routes/v1/     routers and Swagger JSDoc
  services/      business logic
  types/         Express request augmentation
  utils/         ApiError, catchAsync, pagination helpers
  validations/   Joi schemas
  app.ts         Express app
  index.ts       entry point
tests/
  unit/          database mocked
  integration/   routes against a real Postgres
  helpers/       env defaults, DB setup, factories
```

## Database

[Sequelize](https://sequelize.org/) maps models to Postgres, and [sequelize-cli](https://github.com/sequelize/cli) runs migrations and seeders:

```bash
node_modules/.bin/sequelize db:migrate
node_modules/.bin/sequelize db:migrate:undo
node_modules/.bin/sequelize db:seed:all
```

Migrations and seeders stay plain JavaScript because `sequelize-cli` cannot load TypeScript.

## Using with AI coding agents

[AGENTS.md](AGENTS.md) holds the setup and verify commands, request flow, conventions and the steps for adding a resource. `CLAUDE.md` imports it, so Claude Code, Codex, Cursor and Copilot read the same file.

## License

MIT. See [LICENSE](LICENSE).
