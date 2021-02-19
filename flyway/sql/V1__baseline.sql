CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."user" (
    "id" SERIAL NOT NULL,
    "name" varchar (25) NOT NULL,
    "email" varchar (50) UNIQUE NOT NULL,
    "role_id" integer NOT NULL,
    "created_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" varchar NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."role" (
    "id" SERIAL NOT NULL,
    "name" varchar UNIQUE NOT NULL,
    "description" varchar,
    "created_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

ALTER TABLE "user" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id");