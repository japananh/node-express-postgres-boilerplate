# AGENTS.md

REST API boilerplate. This file is the canonical guide for AI coding agents; humans start at [README.md](README.md).

## Stack

- Node >= 26 (`.nvmrc` = 26), TypeScript 5.9 (`strict`, CommonJS), yarn 1
- Express 4, Sequelize 6 + `pg` (Postgres), Joi (`@hapi/joi`), `express-jwt`, `accesscontrol` (RBAC), Winston, swagger-jsdoc
- Jest 29 + ts-jest + supertest, ESLint 8 (Airbnb + Prettier), tsx for dev

## Setup

```bash
yarn install
cp .env.example .env      # set SQL_* to a Postgres you run yourself; docker-compose.yml only has the test DB
node_modules/.bin/sequelize db:migrate
node_modules/.bin/sequelize db:seed:all
yarn dev                  # tsx watch src/index.ts, http://localhost:3000, docs at /v1/docs
yarn build && yarn start  # tsc to dist/, then node dist/index.js
```

## Verify before finishing

Run all three; CI runs the same (`.github/workflows/test.yml`).

```bash
yarn typecheck
yarn lint
yarn test:db:up           # Postgres 16 in Docker on localhost:54329
yarn test                 # unit + integration; yarn test:unit needs no DB
yarn test:db:down         # removes the container and its data
```

## Layout

- `src/config/`: validated env (`config.ts`), `jwt.ts`, `logger.ts`, `roles.ts` (RBAC grants), `postgres.ts`, `morgan.ts`
- `src/routes/v1/`: one router per resource plus swagger JSDoc; `index.ts` mounts them
- `src/validations/`: Joi schemas per resource (`custom.validation.ts` has shared `idParam`, `sortBy`)
- `src/middlewares/`: `validate`, `validateAccessControl` (`grantAccess`), `error`, `rateLimiter`
- `src/controllers/`: thin HTTP handlers wrapped in `catchAsync`
- `src/services/`: business logic and Sequelize queries
- `src/db/models/`: typed Sequelize models; `migrations/` and `seeders/` are plain JS
- `src/db/config/database.js`: sequelize-cli connection (reads `SQL_*` itself)
- `src/docs/`: `swaggerDef.ts` and shared `components.yml` (schemas, responses)
- `src/utils/`: `ApiError`, `catchAsync`, `pick`, `query` (paging, sorting), `auth`
- `src/types/`: Express request augmentation (`req.user`)
- `tests/unit/` (DB mocked), `tests/integration/` (real Postgres), `tests/helpers/` (env, DB reset, factories)

## Request flow

`src/app.ts` applies `jwt()` globally (only `/v1/auth/*` and `/v1/docs/*` are public), then `/v1` routes:

route (`routes/v1/*.route.ts`) -> `validate(schema)` (Joi) -> `grantAccess(action, resource)` -> controller -> service -> Sequelize model -> errors to `errorConverter` / `errorHandler`.

Canonical example to copy: roles. Files: `src/routes/v1/role.route.ts`, `src/validations/role.validation.ts`, `src/controllers/role.controller.ts`, `src/services/role.service.ts`, `src/db/models/role.model.ts`, `tests/integration/role.test.ts`, `tests/unit/services/role.service.test.ts`.

## Add a resource

Replace `widget` with the new name.

1. Migration: `node_modules/.bin/sequelize migration:generate --name create-widget`, then write `up`/`down` in plain JS under `src/db/migrations/`. Use snake_case columns, `created_date_time` / `modified_date_time`, and table name = model name (see `1614435412757-create-role.js`).
2. Model: `src/db/models/widget.model.ts` (`Model<InferAttributes, InferCreationAttributes>` plus an `initWidget(sequelize)` function); call it in `src/db/models/index.ts`, add associations there, export the model.
3. Validation: `src/validations/widget.validation.ts` with `body` / `params` / `query` Joi objects; export it from `validations/index.ts`.
4. Service: `src/services/widget.service.ts`; export it from `services/index.ts`. Throw `ApiError` for expected failures.
5. Controller: `src/controllers/widget.controller.ts` using `catchAsync`; export it from `controllers/index.ts`.
6. Roles: add the resource to `resources` and the grants for each role in `src/config/roles.ts`.
7. Route: `src/routes/v1/widget.route.ts` with `grantAccess(...)` then `validate(...)` then the controller; mount it in `src/routes/v1/index.ts`.
8. Swagger: `@swagger` JSDoc blocks in the route file (picked up from `routes/v1/*.{ts,js}`); reuse `$ref: '#/components/...'` from `src/docs/components.yml`.
9. Tests: a unit test for the service in `tests/unit/services/` and an integration test in `tests/integration/` (use `resetDb`, `createUser`, `bearer` from `tests/helpers`).
10. Run the verify commands.

## Conventions

- Errors: throw `new ApiError(httpStatus.X, 'message')`; wrap async controllers in `catchAsync` so errors reach `middlewares/error.ts`. Error body is `{ code, message }` (plus `stack` in development).
- Config: read env only through `src/config/config.ts` (Joi-validated, fails fast). New variable: add it to the schema, the `EnvVars` interface, `config`, and `.env.example`.
- Logging: `import logger from '../config/logger'`; no `console.log`.
- Naming: files `<resource>.<layer>.ts` (`role.service.ts`); DB tables and columns snake_case; routes plural (`/v1/roles`); `Role`-style PascalCase models.
- Migrations and seeders stay plain JS (`module.exports = { up, down }`).
- Formatting: tab indent (`.editorconfig`), single quotes, 80 columns (Prettier); `yarn lint:fix` applies it.

## Gotchas

- sequelize-cli cannot load TypeScript, so migrations, seeders and `src/db/config/database.js` are JS and must not import from `src/config/config.ts`.
- The integration suite truncates tables: `tests/helpers/env.ts` throws unless `SQL_DATABASE_NAME` contains `test`. Its defaults match `docker-compose.yml`.
- The test DB listens on host port 54329 (not 5432); CI uses a Postgres service on 5432 via `SQL_*` env vars.
- Integration `globalSetup` runs `db:migrate:undo:all` then `db:migrate`, so migrations must be reversible.
- Integration tests share one database; run them with `--runInBand` (`yarn test` already does).
- `grantAccess` switches `*Any` to `*Own` when `req.params.userId` equals the caller's id.
