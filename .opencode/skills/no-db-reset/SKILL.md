---
name: no-db-reset
description: Use ONLY when running, writing, reviewing, or troubleshooting database migrations. Enforces that the database must never be reset, dropped, or recreated during migration work. Triggers on keywords like "migration", "migrate", "schema change", "db migration", "alter table", "add column", "prisma migrate", "drizzle migrate", "knex migrate", "typeorm migration", "sequelize migration", "flyway", "liquibase".
---

# No Database Reset During Migrations

When working with database migrations, **NEVER** reset, drop, or recreate the database. All migrations must be additive and reversible without data loss.

## Absolute Rules

1. **NEVER run commands that reset the database**, including but not limited to:
   - `prisma migrate reset`
   - `prisma db push --force-reset`
   - `drizzle-kit push:force`
   - `DROP DATABASE`
   - `DROP SCHEMA public CASCADE`
   - `TRUNCATE` with cascade on production or staging
   - Any command with `--force-reset`, `--reset`, or similar flags

2. **NEVER suggest or write scripts that:**
   - Delete and recreate the database
   - Drop all tables and recreate them
   - Clear all data as part of a migration workflow

3. **ALWAYS use incremental migrations:**
   - Create new migration files for schema changes
   - Use `ALTER TABLE` to add/modify columns
   - Use `CREATE TABLE` for new tables
   - Write reversible `up` and `down` migrations when supported

## Safe Migration Commands

| Framework        | Safe Command                          |
| ---------------- | ------------------------------------- |
| Prisma           | `prisma migrate dev`                  |
| Prisma           | `prisma migrate deploy`               |
| Drizzle          | `drizzle-kit generate` + `drizzle-kit migrate` |
| Knex             | `knex migrate:latest`                 |
| TypeORM          | `typeorm migration:run`               |
| Sequelize        | `sequelize db:migrate`                |
| Rails            | `rails db:migrate`                    |
| Django           | `python manage.py migrate`            |
| Flyway           | `flyway migrate`                      |
| Liquibase        | `liquibase update`                    |

## If a Migration Fails

1. Investigate the error
2. Fix the migration file
3. Roll back if needed using the framework's rollback command
4. Re-run the corrected migration
5. **Never reset the database to fix a migration issue**

## Data-Preserving Strategies

- Add nullable columns first, then backfill data
- Use default values for new required columns
- Create new tables and migrate data gradually
- Use feature flags to toggle new schema behavior
- Write data migration scripts that transform existing data

## Reminder

Before executing or suggesting any database command, verify it does not reset, drop, or destroy existing data. If the user asks to reset the database, explain why it's dangerous and offer a data-preserving alternative.
