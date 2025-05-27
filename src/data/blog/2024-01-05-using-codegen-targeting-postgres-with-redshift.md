---
author: Ben Packer
pubDatetime: 2024-01-05
title: Using Codegen Targeting Postgres with Redshift
slug: using-codegen-targeting-postgres-with-redshift
featured: false
draft: false
description: A workaround for using kysely-codegen with Redshift by dumping schema to local Postgres
tags:
  - technical
  - database
  - redshift
  - postgres
  - codegen
---

I recently wanted to use [`kysely-codegen`](https://github.com/RobinBlomberg/kysely-codegen) with a Redshift database.

Using it naively (`npx kysely-codegen --url "redshift url"`) stalls. I didn't want to investigate further, since I didn't want to:
1. learn about the specific differences in the introspection schemas between Postgres and Redshift
2. create and maintain a new driver in kysely-codegen

To get around this limitation, I decided I would:
1. Use `pg_dump` to output the schema from Redshift
2. Load that schema into a local Postgres database
3. Run `kysely-codegen` against it.

It ended up working, after some roadblocks.

### Roadblock 1: `pg_dump` server version mismatch

The first issue I ran into was a server version mismatch. With `export DATABASE_URL=<secret stuff>` set, I hit:
```bash
$ pg_dump "$DATABASE_URL"
pg_dump: error: aborting because of server version mismatch
pg_dump: detail: server version: 8.0.2; pg_dump version: 15.5 (Homebrew)
```

I was surprised by this error. I had gotten it before when trying to dump from a version up (dumping from Postgres 15 with `pg_dump@14`) but didn't think it was a problem to go back in time.

Turns out I was right, but up to a limit ([from the docs](https://www.postgresql.org/docs/current/app-pgdump.html#:~:text=pg_dump%20can%20also%20dump%20from,risk%20making%20an%20invalid%20dump.)):
> **pg_dump can also dump from PostgreSQL servers older than its own version**. (Currently, servers back to version 9.2 are supported.)

To get around this, I found some [official Postgres docker images for version 8](https://hub.docker.com/_/postgres/tags?page=1&ordering=-last_updated) lying around that I could use, and updated my script to:
```bash
docker run -v ./:/codegen/ postgres:8.4.22 pg_dump \
  --schema-only \
  -O -x \
  -f /codegen/schema.sql \
  -n $SCHEMA_NAME "$DATABASE_URL"
```

This code runs `pg_dump` inside of a Postgres 8 Docker Image, and writes the output to the image's `/codegen/schema.sql`, which is bound to your local `./`.

The `-O -x` flags skip dumping object ownership and grants. 

### Roadblock 2: Incompatible Dumps

Running `psql -f schema.sql $DATABASE_URL` is the next step in the restore, and I got a few different errors.

First, was:
```
psql:schema.sql: ERROR:  tables declared WITH OIDS are not supported
```

Inspecting `schema.sql`, I found the following setting:
```sql
SET default_with_oids = true;
```

This took me to a weird section of the 8.1 release notes:
> default_with_oids (boolean)
> 
> 	This controls whether CREATE TABLE and CREATE TABLE AS include an OID column in newly-created tables, if neither WITH OIDS nor WITHOUT OIDS is specified. It also determines whether OIDs will be included in tables created by SELECT INTO. In PostgreSQL 8.1 default_with_oids is disabled by default; in prior versions of PostgreSQL, it was on by default.
> 	
> 	The use of OIDs in user tables is considered deprecated, so most installations should leave this variable disabled. Applications that require OIDs for a particular table should specify WITH OIDS when creating the table. This variable can be enabled for compatibility with old applications that do not follow this behavior.

OIDs refer to the internal object identifier of Postgres system objects. They are sort of like a primary key for every schema, table, column, function, etc.

I have typically viewed these as not stable across a `pg_dump` and `psql -f` run, and was surprised to learn that before Postgres 8, users treated them differently.

On the first few pages of Google, I could not find out any relevant history for what this setting was used for in the past and what it meant about the history of Postgres. Maybe there's something interesting there for someone who looks harder.

The second type of incompatibility was the way that `pg_dump` defined defaults. They looked like this:
```sql
    id bigint DEFAULT "identity"(178011160, 0, '1,1'::text) NOT NULL,
```

I didn't know about this (I've barely used Redshift), but it looks like Redshift has [a special type of "identity" column](https://docs.aws.amazon.com/redshift/latest/dg/r_CREATE_TABLE_NEW.html) that can be provided on `CREATE TABLE`. To the Postgres 8 system catalogs, this must look like a standard function call.

For my use cases, I didn't need the defaults. As long as the column was `NOT NULL`, the codegen would be accurate, so I removed these.

### Final Result

After dealing with each of these roadblocks, I now have the final result. It expects that you have `DATABASE_URL` and `SCHEMA` environment variables set, and Docker and Postgres installed locally.

I'm happy enough with the result!

```bash
echo_color() {
  # It's like a dark yellow
  echo -e "\033[0;33m$1\033[0m"
}

echo_color "\n\nPulling down the docker image for postgres:8.4.22";
# We need to use a postgres 8 docker image because Redshift is only wire compatible with PG 8
docker pull postgres:8.4.22

echo_color "\n\nRunning pg_dump inside of the ancient container to generate ./schema.sql - this can take a minute";
# Explanation of the flags:
# -v is used to mount the current working directory as /codegen/ inside the container
# -O excludes ownership, -x excludes privileges - we dont care about mirroring roles
# -f is the output file
# -n is the schema to dump
# -T is the tables to exclude
# TODO - re-include the tables that are excluded once their permissions are fixed
docker run -v ./:/codegen/ postgres:8.4.22 pg_dump \
  --schema-only \
  -O -x \
  -f /codegen/schema.sql \
  -n $SCHEMA "$DATABASE_URL";
  
echo_color "\n\nDropping and recreating the temporary postgres database";
dropdb --if-exists temp_db;
createdb temp_db;

# Due to incompatibilities between PG 8 and whatever modern version is on your computer, we need to use sed/awk to alter the schema.sql file
# pg_dump@8 dumps an oid setting we don't like
# and dumps modern default definitions in an incompatible way
echo_color "\n\nModernizing and trimming ./schema.sql in place";
sed -i '' '/SET default_with_oids = true/d' ./schema.sql
sed -i '' -E 's/(DEFAULT "identity"\([0-9]+, 0, '"'"'1,1'"'"'::text\))//g' ./schema.sql
sed -i '' -E 's/(DEFAULT "default_identity"\([0-9]+, 0, '"'"'1,1'"'"'::text\))//g' ./schema.sql
sed -i '' -E 's/(DEFAULT default_identity\([0-9]+, 0, '"'"'1,1'"'"'::text\))//g' ./schema.sql

# Apply ./schema.sql to the temporary database
echo_color "\n\nRunning ./schema.sql on the temporary database";
psql -d temp_db -f ./schema.sql > /dev/null;


# Run codegen on the temporary database
echo_color "\n\nRunning codegen";
npx kysely-codegen --camel-case --out-file ./dbTypes.ts --include-pattern "$SCHEMA.*" --log-level debug --url "postgres://localhost:5432/temp_db" --schema $SCHEMA;

echo_color "\n\nCleaning up";
dropdb --if-exists temp_db;
rm ./schema.sql;
```