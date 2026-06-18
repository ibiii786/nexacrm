# NexaCRM

Internal CRM for sales and order management. Built with React, Express, PostgreSQL, Redis.

## Prerequisites
- Node.js 20 LTS
- Docker and Docker Compose (for local PostgreSQL and Redis)
- A GitHub account (for CI/CD)

## Local Development Setup

1. Clone the repository
2. Copy `.env.example` to `apps/api/.env` and fill in all values
3. Start the database and Redis: `docker-compose up -d`
4. Install dependencies: `npm install` (from root)
5. Run database migrations: `cd apps/api && npx prisma migrate dev`
6. Seed the database: `cd apps/api && npx prisma db seed`
7. Start all services: `npm run dev` (from root, runs both frontend and backend via Turborepo)
8. Frontend: http://localhost:5173
9. Backend: http://localhost:3001
10. Default super admin login: see SUPER_ADMIN_EMAIL in your .env

## Project Structure

```
nexacrm/
├── apps/
│   ├── web/          ← React frontend (Vite + TypeScript)
│   └── api/          ← Express backend (TypeScript)
├── packages/
│   └── shared/       ← Shared Zod schemas, TypeScript types, constants
├── docker-compose.yml
├── turbo.json
├── HANDOVER.md       ← Deleted when project is complete
└── README.md
```

## Environment Variables
See `apps/api/.env.example` for all required variables with descriptions.

## Running Tests
`npm run test` from root runs all tests across the monorepo.

## Deployment
Frontend deploys automatically to Vercel on push to main.
Backend deploys automatically to Railway/Render on push to main.
See `.github/workflows/` for CI/CD pipeline details.

## Build Status
<!-- GitHub Actions badge — add after CI is configured -->
