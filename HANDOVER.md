# NexaCRM — Handover State

## Last Updated
2026-06-18T13:00:00-04:00 — Phase 3, Steps 11, 12, 13, 14, 15, 16 completed (PHASE 3 COMPLETE)

## What Was Just Completed
- **Permissions Service**: Built `PermissionsService` to correctly resolve effective permissions from user policies and group policies, with Redis cache integration.
- **Users**: Created CRUD service, controller, and routes for users. Includes secure suspend/unsuspend and force logout.
- **Groups**: Created CRUD service, controller, and routes for groups. Handles group memberships and policy attachments.
- **Policies**: Created CRUD service, controller, and routes for policies.
- **Temporary Assignments & Background Jobs**: Implemented `AssignmentsService` and a BullMQ worker (`assignments.worker.ts`) to periodically cleanup expired temporary user policies every 5 minutes.
- **Frontend Admin Panel**: Scaffolded and built `UsersPage`, `GroupsPage`, and `PoliciesPage` with Lucide icons and basic Tailwind styling. Updated the main `Dashboard` to have cards linking to these admin sections.

## Current Project State
**PHASE 3 IS COMPLETE.**
The IAM architecture is strictly enforced on the backend via the `authorize` middleware and database relations, and a basic frontend Admin panel is available to interact with it.

## What Is Next
Phase 4 — Orders Module (Core Application Logic)
- Step 17: Sequence logic for `orderNumber` (YYYY-00001).
- Step 18: Status CRUD and global/status-specific Fields.
- Step 19: Orders CRUD (create with initial status, update, soft delete).
- Step 20: Order audit trail logger (trigger on specific field changes).
- Step 21: File attachments using Cloudflare R2 / local fallback.
- Step 22: Frontend Order management (Board/List views, Detail page, File upload).

## Known Issues / Decisions Made
- Frontend IAM pages (`UsersPage`, `GroupsPage`, `PoliciesPage`) currently lack the full Add/Edit modals to keep initial scope reasonable, but they fully display database state and support delete/suspend actions.
- Background worker for expired assignments runs every 5 minutes via BullMQ, configured and started in `index.ts`.

## Environment Notes
- Ensure Redis is running (used for both Permission Cache and BullMQ).
- Start backend: `cd apps/api && npm run dev`
- Start frontend: `cd apps/web && npm run dev`
