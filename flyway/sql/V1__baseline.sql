CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."user" (
    "id" SERIAL NOT NULL,
    "name" varchar (25) NOT NULL,
    "email" varchar (50) UNIQUE NOT NULL,
    "role" varchar NOT NULL,
    "created_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" varchar NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."token" (
    "token" varchar NOT NULL,
    "user_id" integer NOT NULL,
    "type" varchar NOT NULL,
    PRIMARY KEY ("token")

);

ALTER TABLE "token" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");