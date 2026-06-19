# NexaCRM — Handover State

## Last Updated
2026-06-19T10:57:00Z — Remediation in progress (starting Section 2 of CRM_Remediation_Mandate.md)

## What Was Just Completed
- 2.1 — Edit Window Enforcement: Added `enforceEditWindow` to `orders.service.ts` and updated tests.
- 2.2 — Smart Paste Parser: Created backend utility, route, controller, and frontend `OrderPasteParser.tsx` modal.
- 2.3 & 3.5 — Excel Export & PDF Refactor: Implemented `export.service.ts` using `exceljs` and `pdfkit`. Refactored `payroll.controller.ts` and `orders.controller.ts`. Added frontend UI.

## Current Project State
- Monorepo structure exists and builds (with 34 tsc errors in apps/api)
- Auth system works (login, refresh, logout)
- IAM system exists (users, groups, policies, permissions)
- Orders CRUD exists. Edit window enforcement, Smart Paste Parser, and Excel exports are complete.
- Missing Kanban view, Calendar view.
- Dashboard exists for both roles but "Since You Were Gone" is unverified
- Settings, Notifications, Announcements, Payroll, FB Accounts modules exist
- System-wide audit log is NOT implemented (only order-level)
- Payroll Advances sub-module is NOT implemented
- File upload has no size/type restrictions
- CI/CD deploy gate is broken (cross-file `needs:` does not work in GitHub Actions)
- Backend has no actual deployment step (placeholder only)
- 34 TypeScript errors in apps/api on `tsc --noEmit`

## What Is Next
Section 2.4 — CI/CD Deploy Gate Fix (Merge CI and Deploy into a single main.yml workflow).

## Known Issues / Decisions Made
- Prior "Phase 9 Final" commit was premature — project was not complete
- All items in CRM_Remediation_Mandate.md Sections 2, 3, and 4 are outstanding
- Each fix must be committed individually per the mandate

## Environment Notes
- PostgreSQL via Docker Compose (localhost)
- Redis via Docker Compose (localhost)
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- All env vars in apps/api/.env

## How to Resume
```bash
git clone https://github.com/ibiii786/nexacrm.git
cd nexacrm
npm install
docker-compose up -d
cd apps/api && npx prisma migrate deploy && npx prisma db seed
cd ../..
npm run dev
```
Read CRM_Blueprint.md and CRM_Remediation_Mandate.md before making any changes.
