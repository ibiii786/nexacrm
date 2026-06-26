# NexaCRM — Optimization & Simplification Mandate

## READ THIS ENTIRE DOCUMENT BEFORE TOUCHING ANY FILE

This document contains 10 sequential stages. You complete **exactly one stage**, then **stop completely** and wait for the instruction "proceed" before doing anything else. Do not read ahead and start the next stage. Do not batch stages together. Do not assume permission to continue.

This rule is non-negotiable. Previous work on this project went wrong specifically because too many changes were made in one pass with no human checkpoint. Every stage in this document is a hard stop.

**At the end of every stage, before stopping, you must:**
1. State clearly what files you changed and what you deleted.
2. State what you verified in the running app (if applicable) or what TypeScript check you ran.
3. Commit with the exact commit message given for that stage.
4. Update `HANDOVER.md` at the repo root stating which stage was just completed and which is next.
5. Stop. Do not start the next stage.

---

## WHAT THIS DOCUMENT DOES AND WHY

This project was built with enterprise-grade infrastructure for a team of 6–10 people. The result is a codebase that is harder to maintain and deploy than it needs to be. This document strips out the infrastructure overkill while keeping **every single feature and all application functionality exactly as it is**.

**What gets removed:**
- Redis (external service, used for caching and queuing — unnecessary at this scale)
- Cloudflare R2 (external file storage — local disk is sufficient)
- Bull/BullMQ job queue (background worker — replaced with a simple `setInterval`)
- `packages/shared` monorepo package (causes deployment build-chain complexity — types inlined directly)
- Groups and Policies IAM system (replaced with role-based access: SUPER_ADMIN, ADMIN, USER)
- Exposed secrets and unauthenticated routes in `app.ts`
- All loose debug/test scripts in `apps/api/`

**What stays identical:**
- All order features (table, kanban, calendar, smart paste, copy text, audit log, file uploads)
- All dashboard widgets and charts
- Statuses, custom fields, settings pages
- Payroll module (toggle on/off)
- Facebook Accounts module (toggle on/off)
- Notifications and announcements
- Dark mode, themes, profile
- The 3-role system: SUPER_ADMIN, ADMIN, USER
- Per-user permission customization (direct permission assignment to individual users stays)

**The IAM simplification in plain terms:**
- Groups and Policies are removed entirely (the UI pages, the backend routes, the DB tables).
- The `Permission` table and `UserPermission` table remain — individual users can still have specific permissions assigned directly to them.
- SUPER_ADMIN: all permissions, hardcoded in the auth middleware — no DB lookup needed.
- ADMIN: all permissions by default, **except** `users:manage` is scoped so ADMINs cannot create or delete other ADMINs or SUPER_ADMINs (this check already exists in `users.service.ts` — keep it). ADMINs cannot delete a SUPER_ADMIN account.
- USER: gets `DEFAULT_USER_PERMISSIONS` as before.
- The `authorize()` middleware resolves permissions by: SUPER_ADMIN → pass always. Everyone else → check their `UserPermission` rows directly (no Redis cache, just a DB query). This is fast enough for 10 users.

---

## STAGE 1 — Remove exposed secrets and dangerous unauthenticated routes

**Why first:** These are active security issues in the running production app. Everything else in this document is optimization. This is fixing an open door.

### What to do:

**1a. Delete the temporary migration route from `apps/api/src/app.ts`.**

In `app.ts`, find and delete the entire block starting with the comment `// TEMPORARY MIGRATION ROUTE` and ending after the closing `});` of `app.get('/api/system/migrate', ...)`. This route allows anyone on the internet to execute raw SQL against your production database with no authentication. It was a debugging shortcut that was never removed. Delete it now.

**1b. Fix environment variable exposure.**

Open `apps/api/.env.example`. Verify it contains no real values — only placeholder strings like `your-secret-here`. It should never contain actual passwords, tokens, or keys. If it does, replace every real value with a placeholder.

Open `apps/api/.env.vercel` and `apps/api/.env.vercel.production` and `apps/api/.env.production.local`. Check each one. **If any of these files contain real credentials (database URLs with real passwords, real JWT secrets, real encryption keys), their contents must be replaced with placeholder values.** The real values belong only in Vercel's environment variable dashboard (Settings → Environment Variables), not in any file committed to git.

Note: Since the database password has already been rotated, the old value in these files is harmless but should still be replaced with a placeholder to prevent confusion.

**1c. Generate new JWT secrets.**

The JWT secrets from this project have been exposed in the git history. Generate two new secrets now. Run this command in your terminal (not in the project, just in any terminal):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it twice. The first output is your new `JWT_ACCESS_SECRET`. The second output is your new `JWT_REFRESH_SECRET`.

In `apps/api/.env` (the real local env file, NOT `.env.example`), update these two values to the new generated strings.

Then go to your Vercel project dashboard → Settings → Environment Variables, and update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to the same new values there too.

In `.env.example`, the placeholder should read: `JWT_ACCESS_SECRET=generate-with-node-crypto-randomBytes-64-hex`

**1d. Delete loose debug scripts from `apps/api/`.**

Delete all of the following files. They are debugging artifacts with no place in the committed codebase:

- `apps/api/test3.js`
- `apps/api/test_item_3.js`
- `apps/api/test_settings.js`
- `apps/api/migrate-prod.js`
- `apps/api/reset.js`
- `check.js` (root level)
- `check2.js` (root level)

If any of these files contain test logic you believe is not covered by the real test suite in `apps/api/src/__tests__/`, note that in your stage report. Do not migrate them — the real test suite is sufficient.

Also check `apps/api/src/` for any other `.js` files that are not part of the build (compiled output excluded). If found, delete them.

**1e. Update `.gitignore`.**

Open `.gitignore` at the root. Verify it contains entries for:
```
.env
.env.*
!.env.example
```
The `!.env.example` exception keeps the example file tracked while blocking all real env files. If these entries are missing or incomplete, fix them now. The goal: no `.env.*` file with real values should ever be trackable by git.

**Verification:**
- Run `git status` and confirm no `.env.*` files (except `.env.example`) appear as tracked.
- Start the API locally (`npm run dev` in `apps/api`) and confirm it still starts without errors.
- Confirm the `/api/system/migrate` route no longer exists by curling it: `curl http://localhost:3001/api/system/migrate` should return 404.

**Commit message:** `[SECURITY] Stage 1 — Remove unauthenticated migration route, rotate JWT secrets, clean debug scripts, fix gitignore`

**STOP HERE. Do not continue to Stage 2 until told to proceed.**

---

## STAGE 2 — Remove Redis entirely

Redis is used in three places: permission caching (`permissions.service.ts`), session blacklisting (`authenticate.ts`), and the Bull job queue (`assignments.worker.ts` and `index.ts`). None of these need Redis for a 10-person private app.

**Replacements:**
- Permission caching → query the database directly on every request (fast enough, no cache needed)
- Session blacklisting → the `Session` table in Prisma already has a `revokedAt` column — check it directly
- Bull job queue → replaced in Stage 3 (this stage just removes the Bull/Redis dependency; the job logic is handled separately)

### What to do:

**2a. Rewrite `apps/api/src/services/permissions.service.ts` completely.**

Replace the entire file with this version (which removes all Redis calls and queries the DB directly):

```typescript
import prisma from '../config/database';

export class PermissionsService {
  /**
   * Resolves the effective permissions for a user.
   * Combines direct UserPermission assignments only (Groups/Policies removed).
   * No Redis cache — DB query is fast enough for small teams.
   */
  static async getEffectivePermissions(userId: string): Promise<string[]> {
    const directPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        permission: true
      }
    });

    return directPermissions.map(up => up.permission.name);
  }

  /**
   * No-op: kept for call-site compatibility during migration.
   * Remove callers after Stage 5 (IAM cleanup).
   */
  static async invalidateUserCache(_userId: string): Promise<void> {
    // No Redis cache to invalidate
  }

  static async invalidateGroupCache(_groupId: string): Promise<void> {
    // No Redis cache to invalidate
  }

  static async invalidatePermissionCache(_permissionId: string): Promise<void> {
    // No Redis cache to invalidate
  }

  static async getPermissions() {
    return prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  }
}
```

**2b. Rewrite `apps/api/src/middleware/authenticate.ts` to check session revocation via DB instead of Redis.**

The current file does not actually check Redis for session blacklisting (it just verifies the JWT and checks the user). Verify this by reading the file. If there is no Redis call in `authenticate.ts`, no change is needed here — just confirm and note it in your report. If there IS a Redis call (e.g. checking a blacklist key), replace it with:

```typescript
// Check if the session (refresh token family) has been revoked
// Note: For access tokens, revocation is handled by the short expiry window.
// Force-logout is enforced by revoking sessions in the Session table,
// which prevents refresh token renewal. No Redis check needed here.
```

**2c. Delete `apps/api/src/config/redis.ts`.**

This file is no longer needed. Delete it.

**2d. Rewrite `apps/api/src/index.ts` to remove Redis startup and Bull worker setup.**

Replace the `bootstrap()` function with a version that removes `connectRedis()` and `setupAssignmentsWorker()` calls. The expired assignment cleanup will be replaced with a simple `setInterval` in Stage 3. For now, just remove the calls without replacing them:

```typescript
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import prisma from './config/database';

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
```

**2e. Update `apps/api/src/config/env.ts` to remove `REDIS_URL`.**

In `env.ts`, find the line:
```typescript
REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
```
Delete it. The server will no longer fail to start if `REDIS_URL` is missing or empty.

Also remove `REDIS_URL` from `.env.example` and add a comment: `# Redis removed — no longer required`.

**2f. Uninstall Redis-related packages.**

In `apps/api/`, run:
```bash
npm uninstall ioredis bullmq
```

**2g. Delete `apps/api/src/workers/assignments.worker.ts`.**

This file is the Bull worker. It will be replaced with a simple `setInterval` in Stage 3. Delete it now.

**Verification:**
- Run `npx tsc --noEmit` in `apps/api/` and confirm zero errors related to Redis or Bull imports.
- Start the API with `npm run dev` and confirm it starts successfully without a Redis connection.
- Confirm `/api/orders` returns data correctly (which exercises the permission check path that used to use Redis).

**Commit message:** `[REFACTOR] Stage 2 — Remove Redis and Bull entirely, replace permission caching with direct DB queries`

**STOP HERE. Do not continue to Stage 3 until told to proceed.**

---

## STAGE 3 — Replace Bull worker with setInterval for expired assignment cleanup

The Bull queue previously ran a job every 5 minutes to clean up expired `UserPermission` rows. This is replaced with a simple `setInterval` running inside the server process.

### What to do:

**3a. Read `apps/api/src/services/assignments.service.ts` in full.**

Find the `cleanupExpiredAssignments()` static method. Note its exact name and what it does (it sets `isActive = false` on expired `UserPermission` rows where `expiresAt < now()`). You will call this from the interval.

**3b. Add the cleanup interval to `apps/api/src/index.ts`.**

In the `bootstrap()` function, after `prisma.$connect()` succeeds and before `app.listen()`, add:

```typescript
import { AssignmentsService } from './services/assignments.service';

// Clean up expired temporary permission assignments every 5 minutes.
// Replaces the previous Bull/Redis queue worker.
setInterval(async () => {
  try {
    const count = await AssignmentsService.cleanupExpiredAssignments();
    if (count > 0) {
      logger.info(`[Cleanup] Revoked ${count} expired permission assignments`);
    }
  } catch (err) {
    logger.error('[Cleanup] Failed to clean up expired assignments:', err);
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

Note: Add the import at the top of the file with the other imports. The `setInterval` is placed after DB connect so you're certain the DB is ready before the first tick.

**3c. Update `apps/api/src/services/assignments.service.ts` to remove the Redis cache invalidation calls.**

Open `assignments.service.ts`. In `assignPermissionToUser()` and `revokePermissionAssignment()`, there are calls to `PermissionsService.invalidateUserCache(userId)`. These are now no-ops (Stage 2 made them empty functions), so the calls are harmless but misleading. Remove them from `assignments.service.ts` for clarity. Remove the import of `PermissionsService` from `assignments.service.ts` if it's only used for cache invalidation.

Also check `cleanupExpiredAssignments()` — if it calls `invalidateUserCache`, remove that call too.

**Verification:**
- Run `npx tsc --noEmit` in `apps/api/` — zero errors.
- Start the server and confirm it starts cleanly. Check the logs — there should be no Redis errors and no worker errors.
- In the logs, the cleanup interval will not fire immediately (first fire is after 5 minutes). That is correct behavior.

**Commit message:** `[REFACTOR] Stage 3 — Replace Bull worker with setInterval for expired assignment cleanup`

**STOP HERE. Do not continue to Stage 4 until told to proceed.**

---

## STAGE 4 — Remove Cloudflare R2, use local disk storage

R2 is an AWS S3-compatible service used to store order file attachments. For a small private team, local disk storage using Multer is sufficient and removes an entire external service dependency.

**Important note about Vercel:** Vercel runs serverless functions which have a read-only filesystem — files written during a request are not persisted. This means file uploads will not work on Vercel. This is acceptable because the project is moving to Hostinger. For now, uploads will return a clear error message on Vercel instead of silently failing.

### What to do:

**4a. Rewrite `apps/api/src/services/upload.service.ts` completely.**

Replace the entire file with a local disk implementation:

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// Local uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage: local disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter: images and documents only
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Delete a file from local disk.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOADS_DIR, path.basename(filePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
}

/**
 * Returns the public URL for a file.
 * On local disk, this is a path served by Express's static middleware.
 */
export function getFileUrl(filename: string): string {
  // The API serves /uploads/* as static files (configured in app.ts)
  // FRONTEND_URL is used as the base so frontend can display the image
  return `${env.FRONTEND_URL.replace(/\/$/, '')}/uploads/${filename}`;
}
```

**4b. Update `apps/api/src/services/attachments.service.ts`.**

Read `attachments.service.ts` in full. It currently uses R2 SDK calls (likely `@aws-sdk/client-s3` or similar) to upload and delete files. Replace all R2/S3 calls with:
- For upload: the file is already on disk by Multer — just record the path in the DB.
- For delete: call the new `deleteFile()` from `upload.service.ts`.
- For the file URL stored in the DB: use `getFileUrl(filename)`.

The `Attachment` model in Prisma stores `filePath`. Store just the filename there (e.g. `1234567890-abc.jpg`), not a full URL. The URL is constructed on the fly from the filename using `getFileUrl()`.

**4c. Remove R2 environment variables from `apps/api/src/config/env.ts`.**

Delete these lines from `envSchema`:
```typescript
R2_ACCOUNT_ID: z.string().default(''),
R2_ACCESS_KEY_ID: z.string().default(''),
R2_SECRET_ACCESS_KEY: z.string().default(''),
R2_BUCKET_NAME: z.string().default('nexacrm-uploads'),
R2_PUBLIC_URL: z.string().default(''),
```

Remove the same variables from `.env.example`, replacing them with a comment:
```
# File uploads stored on local disk in /uploads directory.
# No external storage service needed.
```

**4d. Uninstall R2/S3 packages.**

In `apps/api/`, run:
```bash
npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
(Check `apps/api/package.json` for the exact package names used and uninstall only those. If neither is installed, skip this step.)

**4e. Add `uploads/` to `.gitignore`.**

In `.gitignore`, confirm there is already an `uploads/` entry. If not, add:
```
uploads/
```
Uploaded files should never be committed to git.

**4f. Add Vercel upload guard.**

In `apps/api/src/services/attachments.service.ts`, add a check at the top of the upload function:

```typescript
// File uploads require persistent disk storage.
// On Vercel (serverless), the filesystem is ephemeral and uploads will not persist.
// This feature is fully available when deployed to Hostinger or any VPS.
if (process.env.VERCEL) {
  throw new Error('File uploads are not available in the current deployment environment. This feature will be available when the app is deployed to the production server.');
}
```

This gives a clear, honest error message to the frontend instead of a silent failure.

**Verification:**
- Run `npx tsc --noEmit` in `apps/api/` — zero errors.
- Locally, create an `uploads/` folder in `apps/api/`, start the server, and attempt a file upload through the API. Confirm the file lands on disk in `uploads/` and the attachment record is created in the DB with the correct filename.

**Commit message:** `[REFACTOR] Stage 4 — Replace Cloudflare R2 with local disk storage via Multer`

**STOP HERE. Do not continue to Stage 5 until told to proceed.**

---

## STAGE 5 — Collapse `packages/shared` into the apps directly

The `packages/shared` package exists solely because of the monorepo structure. It contains TypeScript types, Zod schemas, and permission constants. These are used by both `apps/api` and `apps/web`. Inlining them directly removes the inter-package build dependency that causes deployment failures.

### What to do:

**5a. Read `packages/shared/src/index.ts`** to understand exactly what it exports. Then read the individual files:
- `packages/shared/src/constants/permissions.ts`
- `packages/shared/src/constants/defaultStatuses.ts`
- `packages/shared/src/constants/fieldTypes.ts`
- `packages/shared/src/types/` (all files)
- `packages/shared/src/schemas/` (all files)

**5b. Create the backend shared constants.**

Create `apps/api/src/constants/permissions.ts` and copy the full contents of `packages/shared/src/constants/permissions.ts` into it verbatim. Do the same for `defaultStatuses.ts` and `fieldTypes.ts` — place them all in `apps/api/src/constants/`.

Create `apps/api/src/types/shared.ts` and copy all type definitions from `packages/shared/src/types/` into it. Merge them into a single file or keep them in separate files under `apps/api/src/types/` — your choice, whichever is cleaner.

Create `apps/api/src/schemas/` and copy all Zod schema files from `packages/shared/src/schemas/` into it.

**5c. Update all `@nexacrm/shared` imports in `apps/api/src/`.**

Search for every file in `apps/api/src/` that imports from `@nexacrm/shared`. For each one, update the import path to point to the new local file. Examples:

```typescript
// Before:
import { PERMISSIONS, PermissionName } from '@nexacrm/shared';
import { DEFAULT_USER_PERMISSIONS } from '@nexacrm/shared';

// After:
import { PERMISSIONS, PermissionName } from '../constants/permissions';
import { DEFAULT_USER_PERMISSIONS } from '../constants/permissions';
```

Do this for every file that imports from `@nexacrm/shared`. Use a project-wide search for `@nexacrm/shared` to find them all.

**5d. Create the frontend shared constants.**

Create `apps/web/src/constants/permissions.ts` and copy the permissions constants there. Create `apps/web/src/types/shared.ts` and copy the shared types there. Create `apps/web/src/schemas/` and copy the Zod schemas there.

**5e. Update all `@nexacrm/shared` imports in `apps/web/src/`.**

Search for every file in `apps/web/src/` that imports from `@nexacrm/shared` and update to local paths, exactly as done in step 5c.

**5f. Remove `@nexacrm/shared` from dependencies.**

In `apps/api/package.json`, remove the `@nexacrm/shared` dependency entry.
In `apps/web/package.json`, remove the `@nexacrm/shared` dependency entry.

**5g. Delete `packages/shared/` entirely.**

Delete the entire `packages/shared/` directory. It is no longer needed.

**5h. Update root `package.json` and `turbo.json`.**

Open root `package.json`. Remove any reference to `packages/shared` in the `workspaces` array. The workspaces array should now only contain `apps/api` and `apps/web`.

Open `turbo.json`. If it has pipeline entries that reference `@nexacrm/shared`, remove them. The build pipeline should now only build `apps/api` and `apps/web`.

**Verification:**
- Run `npx tsc --noEmit` in `apps/api/` — zero errors, zero `@nexacrm/shared` references remaining.
- Run `npx tsc --noEmit` in `apps/web/` — zero errors, zero `@nexacrm/shared` references remaining.
- Run `npm run build` in `apps/web/` — builds successfully.
- Start `apps/api/` with `npm run dev` — starts successfully.

**Commit message:** `[REFACTOR] Stage 5 — Inline packages/shared into apps directly, remove monorepo shared package`

**STOP HERE. Do not continue to Stage 6 until told to proceed.**

---

## STAGE 6 — Remove Groups and Policies IAM system (backend)

This stage removes the Groups/GroupMembers/GroupPermissions system from the backend. The `Permission` table and `UserPermission` table stay — individual users can still have permissions assigned directly. The `Group`, `GroupMember`, and `GroupPermission` models are removed.

### What to do:

**6a. Delete these backend files entirely:**

- `apps/api/src/routes/groups.routes.ts`
- `apps/api/src/controllers/groups.controller.ts`
- `apps/api/src/services/groups.service.ts`

**6b. Update `apps/api/src/routes/index.ts`.**

Remove the import and `router.use('/groups', groupsRoutes)` line. The groups route no longer exists.

**6c. Update `apps/api/src/services/users.service.ts`.**

Read the file. Find any logic that assigns group memberships when creating a user, or fetches group information. Remove it. Users are created with direct permission assignments only.

Find the section that assigns default permissions based on role. It currently uses `DEFAULT_USER_PERMISSIONS` for USER role and `ALL_PERMISSIONS` for ADMIN/SUPER_ADMIN. Keep this logic — it is correct. Just ensure it no longer references groups.

**6d. Update `apps/api/src/services/assignments.service.ts`.**

This service currently handles assigning permissions to users AND managing group memberships. Remove all group-related methods:
- `addUserToGroup()`
- `removeUserFromGroup()`
- `attachPermissionToGroup()`
- `detachPermissionFromGroup()`

Keep:
- `assignPermissionToUser()`
- `revokePermissionAssignment()`
- `cleanupExpiredAssignments()`

**6e. Update `apps/api/src/services/users.service.ts` — admin protection.**

Find the `deleteUser()` method (or wherever user deletion happens). Add a guard: if the user being deleted has role `SUPER_ADMIN`, reject the request regardless of who is making the request:

```typescript
if (targetUser.role === 'SUPER_ADMIN') {
  const err: any = new Error('The Super Admin account cannot be deleted');
  err.code = 'FORBIDDEN';
  throw err;
}
```

Also: if the requester's role is `ADMIN` and the target user's role is `ADMIN` or `SUPER_ADMIN`, reject:

```typescript
if (requesterRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN')) {
  const err: any = new Error('Admins cannot delete other Admin or Super Admin accounts');
  err.code = 'FORBIDDEN';
  throw err;
}
```

**6f. Write and run a Prisma migration to drop Group tables.**

Create a new migration:

```bash
cd apps/api && npx prisma migrate dev --name remove_groups_and_policies
```

Before running this, update `apps/api/prisma/schema.prisma` to remove:
- The `Group` model
- The `GroupMember` model  
- The `GroupPermission` model
- All relations on other models that reference these (the `createdGroups`, `groupMemberships`, `addedGroupMembers` relations on `User`, and the `permissions` relation on `Group`)

Do NOT remove: `Permission`, `UserPermission`, `User`, or anything else.

After editing the schema, run `npx prisma migrate dev --name remove_groups_and_policies`. This will drop the three group tables from the actual database.

**Verification:**
- Run `npx tsc --noEmit` in `apps/api/` — zero errors.
- Check that `/api/groups` returns 404 (route no longer exists).
- Check that `/api/users/:id` still works.
- Check that permission assignment to an individual user still works via `/api/users/:id/assign-permission` or the equivalent existing route.

**Commit message:** `[REFACTOR] Stage 6 — Remove Groups/GroupPermissions IAM system from backend, keep direct UserPermission assignments`

**STOP HERE. Do not continue to Stage 7 until told to proceed.**

---

## STAGE 7 — Remove Groups and Policies IAM system (frontend)

This stage removes the Groups UI pages from the frontend and updates the sidebar.

### What to do:

**7a. Delete these frontend files entirely:**

- `apps/web/src/pages/admin/iam/GroupsPage.tsx`
- `apps/web/src/pages/admin/iam/GroupModal.tsx`
- `apps/web/src/pages/admin/iam/PermissionsPage.tsx`
- `apps/web/src/pages/admin/iam/UserPermissionsModal.tsx`

**Important:** `apps/web/src/pages/admin/iam/UsersPage.tsx` and `apps/web/src/pages/admin/iam/UserModal.tsx` stay — these are for managing individual users and are still needed.

**7b. Update `apps/web/src/App.tsx`.**

Remove these route definitions:
```tsx
<Route path="/admin/groups" element={...} />
<Route path="/admin/permissions" element={...} />
```

Remove the imports for `GroupsPage` and `PermissionsPage`.

Keep the `/admin/users` route — it is still needed.

**7c. Update `apps/web/src/components/layout/Sidebar.tsx`.**

In the `iamNavItems` array, remove the entries for "Groups" and "Permissions":
```typescript
// Remove these two:
{ name: 'Groups', path: '/admin/groups', icon: Users },
{ name: 'Permissions', path: '/admin/permissions', icon: ShieldCheck },
```

Keep:
```typescript
{ name: 'Users', path: '/admin/users', icon: Users },
// Audit Log stays if it's in the list
```

**7d. Update `apps/web/src/pages/admin/iam/UsersPage.tsx`.**

Read this file. It may have UI elements for assigning group membership to users. Remove any UI that references groups (e.g. "Add to group", group membership panels). The user detail view should show individual permission assignments only.

Also check `apps/web/src/pages/admin/iam/UserModal.tsx`. If it has any group-related fields or sections, remove them.

**7e. Check for any other group/permission references.**

Search the entire `apps/web/src/` directory for:
- `GroupsPage`
- `/admin/groups`
- `/admin/permissions`
- `PermissionsPage`
- `UserPermissionsModal`
- `groupId`
- `/groups`

For each occurrence found, remove or update the reference so it no longer points to the deleted pages or the removed backend routes.

**Verification:**
- Run `npx tsc --noEmit` in `apps/web/` — zero errors.
- Run `npm run build` in `apps/web/` — builds successfully with no import errors.
- In the running app, confirm the sidebar no longer shows "Groups" or "Permissions" links for any role.
- Confirm the Users admin page still loads and shows the user list correctly.

**Commit message:** `[REFACTOR] Stage 7 — Remove Groups/Permissions UI pages from frontend`

**STOP HERE. Do not continue to Stage 8 until told to proceed.**

---

## STAGE 8 — Fix the page-refresh auth bug

This is the bug reported in the QA report as 2.1.9: refreshing the browser on any protected page causes a broken state where API requests return 401 and the UI shows missing data (empty username, broken sidebar) instead of properly re-authenticating.

**Root cause:** On hard refresh, the Zustand `authStore` is reset to its initial state (`accessToken: null`). The `ProtectedRoute` component checks `isAuthenticated` and — because the store is empty — calls `/api/auth/me`. But `/api/auth/me` requires a Bearer token, and since the access token is gone from memory, it fails. The silent refresh interceptor in `api.ts` should catch the 401 and call `/auth/refresh` using the HttpOnly cookie, but the timing and order of operations in `ProtectedRoute` prevents this from working correctly.

### What to do:

**8a. Read `apps/web/src/components/auth/ProtectedRoute.tsx` and `apps/web/src/lib/api.ts` in full** before making any changes.

**8b. Fix `ProtectedRoute.tsx`.**

The `ProtectedRoute` should attempt silent refresh first, then fetch the user. Replace the `checkAuth` function with this logic:

```typescript
const checkAuth = async () => {
  // If we already have auth state in memory (e.g. navigating between routes), skip
  if (isAuthenticated) {
    setLoading(false);
    return;
  }

  try {
    // Step 1: Attempt to get a fresh access token via the HttpOnly refresh cookie.
    // This covers the hard-refresh case where the in-memory access token is gone.
    const refreshResponse = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const { accessToken } = refreshResponse.data.data;

    // Step 2: Fetch the current user with the new access token
    const meResponse = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Step 3: Restore auth state
    if (mounted) {
      await useAuthStore.getState().fetchSettings();
      useAuthStore.setState({
        accessToken,
        isAuthenticated: true,
        user: meResponse.data.data.user,
        isLoading: false,
      });
      // Persist new access token
      localStorage.setItem('token', accessToken);
    }
  } catch (error) {
    // Refresh failed — token expired or no session. Send to login.
    if (mounted) {
      clearAuth();
    }
  }
};
```

You will need to import `axios` (not the `api` instance — the base axios, to avoid the interceptor loop) and `API_URL` at the top of `ProtectedRoute.tsx`. Check how `api.ts` already defines `API_URL` and use the same value or import it.

**8c. Verify the refresh token endpoint works correctly.**

Read `apps/api/src/services/auth.service.ts` — specifically the `refresh()` method. Confirm it:
1. Reads the refresh token from the `refreshToken` HttpOnly cookie
2. Verifies it against the `Session` table (checks `revokedAt` is null and `expiresAt` is in the future)
3. Issues a new access token
4. Returns the new access token in the response body

If any of these steps are broken or missing, fix them as part of this stage. The refresh endpoint is `POST /api/auth/refresh`.

**8d. Fix the silent refresh interceptor in `apps/web/src/lib/api.ts`.**

The current interceptor calls `useAuthStore.getState().setAuth(...)` when updating the token after a silent refresh. But `setAuth()` fetches settings again, which is wasteful on every token refresh. Update the 401 interceptor to only update the `accessToken` in the store, not call the full `setAuth()`:

```typescript
// After successful refresh, just update the token:
useAuthStore.setState({ accessToken });
localStorage.setItem('token', accessToken);
```

**Verification:**
1. Log in to the app successfully.
2. Reload the browser (F5 / Cmd+R) on the dashboard page.
3. Confirm you remain logged in, the username shows correctly, the sidebar is complete, and no 401 errors appear in the browser dev tools Network tab.
4. Open a new browser tab and navigate directly to `/orders`. Confirm you stay logged in (tab shares the same cookies).
5. Log out. Try to navigate to `/dashboard` directly. Confirm you are redirected to `/login`.

**Commit message:** `[FIX] Stage 8 — Fix hard-refresh auth bug by attempting silent token refresh in ProtectedRoute`

**STOP HERE. Do not continue to Stage 9 until told to proceed.**

---

## STAGE 9 — Fix remaining confirmed bugs from QA report

This stage fixes the three remaining confirmed code bugs: the dead Edit Order button, the missing `NX-` order number prefix, and silent file upload error handling.

### What to do:

**9a. Fix the dead "Edit Order" button in `apps/web/src/pages/orders/OrderDetailPage.tsx`.**

Read `OrderDetailPage.tsx` in full. Find the "Edit Order" button — it currently has no `onClick` handler. You need to wire it up to open `OrderModal` (or whatever modal component is used for editing orders — check `apps/web/src/components/orders/OrderModal.tsx`).

Add state:
```tsx
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
```

Update the button:
```tsx
<button onClick={() => setIsEditModalOpen(true)}>Edit Order</button>
```

Add the modal below (outside the button, but inside the component's return):
```tsx
{isEditModalOpen && order && (
  <OrderModal
    order={order}
    onClose={() => setIsEditModalOpen(false)}
    onSave={() => {
      setIsEditModalOpen(false);
      fetchOrder(); // re-fetch the order to show updated data
    }}
  />
)}
```

Check what props `OrderModal` currently accepts for edit mode. If it accepts an `order` prop to pre-fill fields (edit mode) vs no `order` prop (create mode), pass the existing order object. If `OrderModal` has a different API, adapt accordingly — read the component first.

**9b. Fix the missing `NX-` prefix in `apps/api/src/services/orderSequence.service.ts`.**

Read the file. Find the line that constructs the order number string. It currently returns something like:

```typescript
return `${currentYear}-${paddedNumber}`;
```

Change it to:
```typescript
return `NX-${currentYear}-${paddedNumber}`;
```

**Note:** Existing orders in the database already have order numbers without the prefix (e.g. `2026-00001`). Do NOT attempt to rename them. New orders going forward will have the `NX-` prefix. The old orders remain as-is — this is acceptable.

**9c. Fix silent file upload error in `apps/web/src/pages/orders/OrderDetailPage.tsx`.**

Find the `handleFileUpload` function. The `catch` block currently only does `console.error(...)`. Replace it with:

```typescript
} catch (error: any) {
  console.error('File upload failed', error);
  const message = error.response?.data?.error?.message || 'File upload failed. Please try again.';
  toast.error(message);
}
```

Confirm `toast` from `react-hot-toast` is already imported in this file. If not, add the import.

**Verification:**
1. Navigate to any existing order's detail page. Confirm the "Edit Order" button opens the edit modal with the existing order's data pre-filled.
2. Make a small edit and save. Confirm the order detail page reflects the change without needing a full page reload.
3. Create a new order and confirm its order number follows the `NX-YYYY-NNNNN` format.
4. On Vercel (or locally with the Vercel guard from Stage 4 active), attempt a file upload and confirm a toast error message appears instead of silent failure.

**Commit message:** `[FIX] Stage 9 — Wire up Edit Order button, fix NX- order number prefix, add toast on upload error`

**STOP HERE. Do not continue to Stage 10 until told to proceed.**

---

## STAGE 10 — Final verification, env cleanup, and deployment check

This is the final stage. No new code changes — this stage verifies the whole system works correctly end to end after all the changes made in Stages 1–9.

### What to do:

**10a. Full TypeScript check.**

Run `npx tsc --noEmit` in both `apps/api/` and `apps/web/`. There must be zero errors. If there are errors, fix them now before continuing. Do not proceed with any remaining errors.

**10b. Full test suite.**

Run `npm run test` in `apps/api/`. All existing tests must pass. If any tests fail because they imported from `@nexacrm/shared` (now removed) or referenced Redis or Bull, update those test files to use the new local import paths. Do not delete passing tests.

**10c. End-to-end smoke test in the running app.**

Walk through this sequence in the real running local app:

1. Start both `apps/api` and `apps/web` with `npm run dev`.
2. Confirm the server starts with no Redis connection errors and no worker errors.
3. Log in as SUPER_ADMIN. Confirm login works.
4. Reload the browser (F5). Confirm you stay logged in (Stage 8 fix).
5. Navigate to Orders. Confirm orders load with the default date range filter.
6. Create a new order via Smart Paste. Confirm the new order number starts with `NX-`.
7. Open the new order's detail page. Click "Edit Order". Confirm the modal opens with the order pre-filled.
8. Navigate to Admin → Users. Confirm the user list loads.
9. Confirm the sidebar does NOT show "Groups" or "Permissions" links.
10. Navigate to Settings. Confirm all settings tabs load.
11. Log out. Confirm redirect to login.

**10d. Verify the Vercel environment variables.**

In your Vercel project dashboard (not in code), confirm these environment variables are set with real values:
- `DATABASE_URL` (updated with the new rotated database password)
- `DIRECT_URL` (same, updated)
- `JWT_ACCESS_SECRET` (new value generated in Stage 1)
- `JWT_REFRESH_SECRET` (new value generated in Stage 1)
- `ENCRYPTION_KEY`
- `FRONTEND_URL`
- `NODE_ENV=production`

Confirm `REDIS_URL` is no longer listed (or if it is, it can be deleted — it is no longer read by the app).

**10e. Deploy to Vercel.**

Push all commits to the main branch. Confirm the Vercel build succeeds. After deploy, visit the production URL and repeat steps 3–11 of the smoke test against production.

**10f. Update `HANDOVER.md`.**

Rewrite `HANDOVER.md` to reflect the current state:

```markdown
# NexaCRM — Handover State

## Last Updated
[current date] — Optimization complete (all 10 stages)

## What Was Just Completed
Full optimization pass per NexaCRM_Optimization_Mandate.md:
- Redis removed (permissions query DB directly)
- Cloudflare R2 removed (local disk storage via Multer)
- Bull/BullMQ removed (setInterval for cleanup)
- packages/shared removed (types inlined into both apps)
- Groups/GroupPermissions IAM removed (direct UserPermission assignments remain)
- Unauthenticated migration route removed from app.ts
- JWT secrets rotated
- Debug scripts deleted
- Auth hard-refresh bug fixed
- Edit Order button wired up
- NX- order number prefix fixed
- File upload error now shows toast

## Current Project State
App is deployed on Vercel. All features working. No Redis. No R2. No Bull.
Monorepo still uses Turborepo with apps/api and apps/web (packages/shared removed).
File uploads are disabled on Vercel (ephemeral filesystem). Will be enabled on Hostinger.

## What Is Next
When moving to Hostinger: collapse monorepo into single Express app serving 
React as static files. Remove Turborepo. One process, one deployment.

## Known Issues
- File uploads disabled on Vercel (by design, until Hostinger migration)
- Existing order numbers in DB do not have NX- prefix (acceptable, only new orders get it)

## How to Resume
cd apps/api && npm run dev   (starts API on port 3001)
cd apps/web && npm run dev   (starts frontend on port 5173)
Requires: PostgreSQL (Supabase), no Redis needed
```

**Commit message:** `[DONE] Stage 10 — Full optimization verified, deployment confirmed, handover updated`

---

## RULES SUMMARY (re-read if you are ever unsure)

1. One stage at a time. Stop completely after each one.
2. Do not start a stage until told "proceed".
3. Commit after every stage with the exact message given.
4. Update `HANDOVER.md` after every stage.
5. If you find something broken that is outside the current stage's scope, note it in your report — do not fix it silently, and do not skip fixing the current stage to go fix it.
6. If you cannot complete a step in a stage (e.g. a file does not exist where expected, or a type error cascades into many files), stop, report exactly what you found and where you are stuck, and wait for instruction. Do not guess.
7. Never touch the Prisma schema without running a migration immediately after. Never modify the DB directly.
8. Never remove a feature. If something looks unused but you are not certain, leave it and note it in your report.
