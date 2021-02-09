CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."users" (
    "id" SERIAL NOT NULL,
    "name" varchar (25) NOT NULL,
    "email" varchar (50) UNIQUE NOT NULL,
    "role" varchar NOT NULL,
    "created_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date_time" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" varchar NOT NULL,
    PRIMARY KEY ("id")
);
