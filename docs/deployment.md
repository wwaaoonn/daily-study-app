# Deployment Guide

This project uses Next.js, Prisma, and PostgreSQL.
The recommended production setup is:

- Database: Supabase Postgres
- App hosting: Vercel

This document explains how to:

- migrate the current local PostgreSQL data to Supabase
- configure local development after the migration
- configure production environment variables
- run Prisma migrations safely after deployment

## Current Project Structure

Important files:

- App code: `app/`
- Prisma schema: `app/app/prisma/schema.prisma`
- Prisma migrations: `app/app/prisma/migrations/`
- Local development env file: `app/.env.local`
- Root Prisma config: `prisma.config.ts`

The application reads `DATABASE_URL` directly in `app/app/lib/prisma.ts`.

## Recommended Connection Strategy

Use different Supabase connection strings depending on the purpose.

- Local development: `Session pooler` on port `5432`
- Prisma migration / manual SQL / import-export: `Session pooler` on port `5432` or `Direct connection` on port `5432`
- Production app on Vercel or another serverless host: `Transaction pooler` on port `6543`

Recommended variables:

- `DATABASE_URL`: the connection string used by the running app
- `DIRECT_DATABASE_URL`: optional direct or session connection for migrations and maintenance

## Supabase Setup

1. Create a Supabase project.
2. Open `Connect` in the Supabase dashboard.
3. Copy these connection strings:
   - Session pooler `5432`
   - Transaction pooler `6543`
   - Optional direct connection `5432`
4. Keep the database password in a secure password manager.
5. If a real password was pasted into chat or shared elsewhere, rotate it in Supabase.

## Initial Database Migration From Local PostgreSQL

This project was previously using a local PostgreSQL database like:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

To preserve existing data, migrate the database with `pg_dump` and `psql` instead of recreating tables manually.

### 1. Create a temporary backup directory

From the repository root:

```bash
mkdir -p ./app/tmp
```

### 2. Export the local database

From the repository root:

```bash
pg_dump "postgresql://postgres:postgres@localhost:5432/postgres" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=./app/tmp/local-postgres.sql
```

### 3. Import into Supabase

Use the Supabase `Session pooler` connection on port `5432`.

```bash
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -f ./app/tmp/local-postgres.sql
```

### 4. Verify imported data

Run this in the Supabase SQL Editor:

```sql
select
  (select count(*) from "User") as users,
  (select count(*) from "Question") as questions,
  (select count(*) from "Answer") as answers,
  (select count(*) from "DailyDelivery") as daily_deliveries;
```

Also confirm that `_prisma_migrations` exists in Supabase.
If it was imported successfully, future Prisma deployments are simpler and safer.

## Local Development Configuration

After the data migration, point local development to Supabase.

Edit `app/.env.local`:

```env
# Local development against Supabase
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Optional: use for maintenance or future Prisma workflows
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

Then start the app:

```bash
cd app
npm run dev
```

If the app can load questions and save answers correctly, the local migration is complete.

## Production Environment Variables

For Vercel or another serverless platform, use the transaction pooler for the running app.

Recommended production variables:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
CRON_SECRET="a-long-random-shared-secret"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
MAIL_FROM="Budledge <noreply@mail.budledge.dev>"
APP_BASE_URL="https://budledge.dev"
```

Use:

- `DATABASE_URL` for the deployed app
- `DIRECT_DATABASE_URL` only for admin tasks, migrations, or debugging workflows
- `CRON_SECRET` for authenticating Vercel Cron requests to `/api/cron/daily-question`
- `RESEND_API_KEY`, `MAIL_FROM`, and `APP_BASE_URL` for sending daily emails with production links

## Vercel Setup

This repository is a multi-directory project and the actual Next.js app lives in `app/`.
When creating the Vercel project, make sure the root directory points to `app`.

### Recommended Vercel project settings

- Framework Preset: `Next.js`
- Root Directory: `app`
- Install Command: leave default
- Build Command: leave default unless you later need a custom Prisma step
- Output Directory: leave default
- Node.js version: use the Vercel default supported by Next.js 16, or pin a recent LTS version if your team prefers explicit control

### Required Vercel environment variables

Set these in the Vercel project settings.

#### Production

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
CRON_SECRET="a-long-random-shared-secret"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
MAIL_FROM="Budledge <noreply@mail.budledge.dev>"
APP_BASE_URL="https://budledge.dev"
```

Optional:

```env
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

#### Preview

Preview deployments can usually use the same database at first:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
CRON_SECRET="a-long-random-shared-secret"
```

If you later want safer isolation, switch Preview to a separate Supabase project.

### How to create the Vercel project

1. Push this repository to GitHub.
2. In Vercel, choose `Add New...` -> `Project`.
3. Import the GitHub repository.
4. In project configuration:
   - set `Root Directory` to `app`
   - confirm the framework is `Next.js`
5. Open `Environment Variables`.
6. Add `DATABASE_URL` for `Production`.
7. Add `CRON_SECRET` for `Production` so Vercel Cron can authenticate to `/api/cron/daily-question`.
8. Add `RESEND_API_KEY`, `MAIL_FROM`, and `APP_BASE_URL` for any environment that should send emails.
9. Add `DATABASE_URL` for `Preview` if you want preview deployments to work.
10. Add `CRON_SECRET` for `Preview` if Preview should also support cron testing.
11. Optionally add `DIRECT_DATABASE_URL` for future migration or admin workflows.
12. Start the first deployment.

### After the first deployment

Open the deployed site and verify:

- the app loads without a server error
- questions can be read from the database
- creating users or saving answers works

Then inspect the Vercel function logs if something fails.

### Common Vercel mistakes

- `Root Directory` was left at the repository root instead of `app`
- `DATABASE_URL` was set to `5432` instead of `6543` for serverless runtime
- `CRON_SECRET` was missing, so the cron endpoint could not authenticate scheduled requests
- the Supabase password was copied incorrectly
- `RESEND_API_KEY`, `MAIL_FROM`, or `APP_BASE_URL` was missing in the environment that should send emails
- environment variables were added only for one environment and not for the one being deployed

### Prisma on Vercel

For this project, the application runtime only needs `DATABASE_URL`.
For future schema deployments, run Prisma migrations in a controlled step and avoid using `prisma db push` against production.

Typical workflow:

1. create a migration locally
2. commit the migration files
3. apply them with `npx prisma migrate deploy` in the target environment

If you later automate migrations during deployment, make sure that step uses a `5432` direct or session connection rather than the app's `6543` runtime connection

## Prisma Migration Workflow After Deployment

This repository already contains Prisma schema and migrations:

- `app/app/prisma/schema.prisma`
- `app/app/prisma/migrations/`

When deploying schema changes later:

1. Create a Prisma migration during development.
2. Commit the migration files.
3. Apply them in the deployment environment.

Example:

```bash
cd app
npx prisma migrate deploy
```

Important notes:

- Do not use `prisma db push` in production as the primary deployment workflow.
- Prefer `prisma migrate deploy` once the schema is under migration control.
- If `_prisma_migrations` was imported with the existing data, Prisma can usually continue normally.
- If migration history is missing or inconsistent, resolve that before running new migrations.

## Suggested Environment Layout

### Local development

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

### Production

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
CRON_SECRET="a-long-random-shared-secret"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
MAIL_FROM="Budledge <noreply@mail.budledge.dev>"
APP_BASE_URL="https://budledge.dev"
```

## Deployment Checklist

- Supabase project created
- Existing local data exported with `pg_dump`
- Supabase import completed with `psql`
- Row counts verified in Supabase
- `_prisma_migrations` confirmed
- `app/.env.local` updated to Supabase `5432`
- Local `npm run dev` verified
- Production `DATABASE_URL` configured to Supabase `6543`
- Production `CRON_SECRET` configured in Vercel
- Production `RESEND_API_KEY`, `MAIL_FROM`, and `APP_BASE_URL` configured in Vercel
- Production `DIRECT_DATABASE_URL` stored securely

## Troubleshooting

### `pg_dump` cannot open the output file

Create the output directory first:

```bash
mkdir -p ./app/tmp
```

### `psql` or `pg_dump` is not installed

Install PostgreSQL client tools locally before continuing.

### The app works locally but fails in production

Check that:

- production uses the `6543` connection string
- the password is correct
- `CRON_SECRET` is set for the deployed environment
- `RESEND_API_KEY`, `MAIL_FROM`, and `APP_BASE_URL` are set for the deployed environment
- the environment variables are set in the hosting provider

### Prisma migration errors after import

Check whether `_prisma_migrations` exists and contains the historical records from the local database.
If that table is missing or incomplete, handle the baseline state before applying new migrations.
