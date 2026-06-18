# NexaCRM — Handover State

## Last Updated
2026-06-18T12:09:00-04:00 — Phase 1, Step 3 completed

## What Was Just Completed
- Created `packages/shared` types, Zod schemas, permission constants, field type constants, default status constants, API response types (Step 2 completed)
- Created `apps/api/src/config` with `env.ts` (Zod validation), `database.ts` (Prisma singleton with soft-delete middleware), `logger.ts` (Winston), `redis.ts` (Redis client)
- Created `apps/api/src/app.ts` (Express with Helmet, CORS)
- Created `apps/api/src/index.ts` (Express server bootstrap, Redis/DB connect)
- Created `apps/api/prisma/schema.prisma` mapping the complete database schema from Section 5
- Created `apps/api/prisma/seed.ts` (Idempotent seed script for settings, SUPER_ADMIN, permissions, statuses, fields)
- Ran `npm install` at root (successfully installed all dependencies)
- Created `apps/api/.env` from template

## Current Project State
The monorepo structure is complete. Shared types and API base server files are written. The full Prisma schema and seed script are ready to be applied.

## What Is Next
Phase 1, Step 4 — Run initial migration and seed. (Requires Docker)
Phase 1, Step 5 — Set up apps/web.
Phase 1, Step 6 — Docker Compose for local dev.

*Action Required: The Docker Desktop daemon must be started before proceeding to run `npx prisma migrate dev --name init` and `npx prisma db seed`.*

## Known Issues / Decisions Made
- Docker Desktop is currently not running on the system. Could not run database migrations or start the database server.
- Added `deletedAt` to the `User` model in Prisma schema to accommodate the soft-delete middleware requested by Section 12 point 3.

## Environment Notes
`.env` has been created in `apps/api/`. `DATABASE_URL` uses localhost:5432 which expects the Docker container to be running.

## How to Resume
1. Start Docker Desktop
2. Clone repo (if starting fresh)
3. Run `npm install`
4. Start infrastructure: `docker-compose up -d`
5. Run migrations: `cd apps/api && npx prisma migrate dev --name init`
6. Seed database: `cd apps/api && npx prisma db seed`
7. Continue to Phase 1, Step 5
