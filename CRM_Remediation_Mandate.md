# NexaCRM — Remediation & Completion Mandate

## CRITICAL: READ THIS BEFORE TOUCHING ANY CODE

This document is the result of a direct audit of the actual repository at `github.com/ibiii786/nexacrm` — not a review of commit messages or claims. The codebase was cloned and every finding below was confirmed by reading the real source files, running `tsc --noEmit`, searching for specific implementations, and inspecting the CI/CD workflow files directly.

**The project is currently NOT complete, despite prior commits claiming Phase 9 (final) was reached.** Several required features are entirely absent, one CI/CD safety mechanism is broken in a way that allows untested code to deploy, and one required security control (edit window enforcement) does not exist at all, meaning a stated permission rule is not actually enforced.

This document exists to be handed to any agent — regardless of which model — and have that agent fix every item listed, verify the fix, and not stop or declare the project complete until every single item in this document is resolved and confirmed working.

**Do not skip items. Do not mark anything as done without verifying it yourself by reading the code and running it. Do not trust prior commit messages, prior HANDOVER.md content, or prior claims of completion — verify everything from the actual current state of the repository.**

---

## SECTION 1: HOW TO USE THIS DOCUMENT

1. Clone the repository fresh. Do not trust your memory or any cached understanding of this codebase from a previous session.
2. Read this entire document before writing any code.
3. Work through every item in Section 2 (Critical Gaps) first, in order. These are blocking — the project is not safe or functional without them.
4. Then work through Section 3 (Significant Gaps).
5. Then work through Section 4 (Items Requiring Verification) — these were not confirmed broken, only unable to be checked in the prior audit. Verify each one properly and fix if broken.
6. After every item is fixed, run the full verification checklist in Section 5. Every single line must pass. Not "mostly pass" — pass.
7. Only after Section 5 passes completely, proceed to Section 6 (Final Completion Protocol).
8. Recreate `HANDOVER.md` at the root of the repository if it does not exist, and follow the Git/Handover protocol from the original blueprint (`CRM_Blueprint.md`, Section 0) for the remainder of this work — commit after every fix, update HANDOVER.md, push.
9. Do not delete `HANDOVER.md` until Section 5's full checklist passes with zero failures and Section 6 is complete.

This document and `CRM_Blueprint.md` should be read together. This document tells you what is broken or missing. The blueprint tells you how it was supposed to be built. Where they conflict, the blueprint is the source of truth for intended design; this document is the source of truth for what currently needs fixing.

---

## SECTION 2: CRITICAL GAPS (BLOCKING — FIX FIRST)

### 2.1 — Edit Window Enforcement Is Completely Missing

**What was found:** The `settings` table and `settings.service.ts` define `editWindowMinutes` (default 30), but this value is never read or checked anywhere in `orders.service.ts` or any other file. A regular `USER` can currently edit any order they created at any time, indefinitely — the blueprint requires this to be blocked after the configured window unless the user is `ADMIN` or `SUPER_ADMIN`.

**What must be done:**
- In the order update logic (`orders.service.ts`, the update method), before applying any change, fetch the current `editWindowMinutes` setting.
- Compute `order.createdAt + editWindowMinutes`. If `now()` is past that time AND the requesting user's role is not `ADMIN` or `SUPER_ADMIN`, reject the request.
- The rejection must return HTTP 403 with error code `EDIT_WINDOW_EXPIRED` and a clear message, following the standard error response shape defined in the blueprint (Section 12, point 12).
- This check must also apply to the delete operation for the same order, not just update.
- Write a test that creates an order, artificially backdates `createdAt` past the edit window (or mocks the clock), and confirms a `USER` gets 403 while an `ADMIN` succeeds.
- Confirm this is also enforced for bulk update/delete operations, not just single-order operations.

**This is not optional or stylistic. This is a security and business-logic requirement that was specified explicitly and is currently not implemented at all.**

---

### 2.2 — Smart Paste Parser Does Not Exist

**What was found:** No file, route, service, or test exists anywhere in the repository implementing the smart paste feature. This was specified as a core differentiator feature in the blueprint (Section 11), with a complete algorithm provided.

**What must be done:**
- Implement `POST /api/orders/parse-paste` exactly as specified in `CRM_Blueprint.md` Section 11.
- The parser must run server-side only (never expose field metadata or matching logic to the client beyond the final result).
- Implement the full algorithm: line splitting, delimiter detection (`:` or ` - `), fuzzy field-name matching (exact match → contains match → Levenshtein distance ≤ 2), date normalization via date-fns, phone number normalization, currency value parsing.
- Return both mapped fields and unknown fields in the response, exactly as specified.
- Build the corresponding frontend component (`OrderPasteParser.tsx`) that lets a user paste raw text, shows the pre-filled form from mapped fields, and shows a checkbox list of unknown fields with the prompt "We found '[X]' — add as new field?"
- Write unit tests covering: a clean well-formatted input, an input with unrecognized fields, an input with no delimiters on some lines, a date in multiple formats, a phone number with formatting characters, a currency value with symbols and commas.

---

### 2.3 — Excel Export Does Not Exist

**What was found:** `exceljs` is listed as a dependency in `apps/api/package.json` but is never imported or used anywhere in the codebase. There is no working Excel export for orders, payroll, or any other module, despite this being a required export format throughout the blueprint (Orders Module, Payroll Module).

**What must be done:**
- Implement `export.service.ts` using ExcelJS as specified in the blueprint (Section 6, file tree; Section 12, point 8).
- Implement server-side Excel generation for: orders (filtered current view), payroll summary.
- Wire this into the existing export routes/controllers (`POST /api/export/orders`, `POST /api/export/payroll-summary`) — check whether these routes currently exist and return something else (e.g. only PDF or CSV); if they exist but don't support `.xlsx`, add that format option.
- Verify the generated file opens correctly in Excel/LibreOffice/Google Sheets and contains correct headers, correct data, and correct formatting (currency columns formatted as currency, date columns formatted as dates).
- Test with at least 500 rows to confirm it does not hang or crash given the blueprint's explicit instruction that large exports must be server-side, not client-side, for this reason.

---

### 2.4 — CI/CD Deploy Gate Is Broken — Untested Code Can Reach Production

**What was found:** `.github/workflows/deploy.yml` contains:
```yaml
needs: build-and-test
```
This is intended to make deployment depend on the CI tests passing. However, `build-and-test` is a job defined in a **separate workflow file** (`ci.yml`). GitHub Actions' `needs:` keyword only creates dependencies between jobs **within the same workflow file**. Across separate workflow files, this keyword has no effect and is silently ignored. The file's own comment acknowledges this uncertainty ("We'll assume CI runs first") — this is not a safe assumption for a production deployment gate.

**Practical consequence: code with failing tests or a failing build can currently be deployed to production with no automated block.**

**What must be done — choose one of these two correct patterns:**

**Option A (preferred): Merge into a single workflow.**
Combine `ci.yml` and the deploy steps into one workflow file with two jobs, where the deploy job uses `needs: build-and-test` correctly (now valid because both jobs are in the same file):
```yaml
jobs:
  build-and-test:
    # ... existing CI steps ...
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    # ... existing deploy steps ...
```

**Option B: Use `workflow_run` trigger.**
Keep them separate, but trigger `deploy.yml` only on the successful completion of `ci.yml`:
```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types:
      - completed

jobs:
  deploy:
    if: github.event.workflow_run.conclusion == 'success'
    # ... existing deploy steps ...
```

- Implement one of these two patterns — do not invent a third approach that doesn't actually create a hard dependency.
- After implementing, verify it actually works: intentionally break a test on a branch, open a PR, confirm CI fails, confirm deploy does NOT run. Then fix the test, confirm CI passes, confirm deploy runs. This must be demonstrated, not assumed.

---

### 2.5 — Backend Has No Actual Deployment Step

**What was found:** In `deploy.yml`, the backend deployment step is:
```yaml
- name: Deploy Backend to Railway/Render
  run: |
    echo "Deploying to Railway/Render..."
    # Add railway/render CLI commands here when service is provisioned
```
This is a placeholder. The backend does not actually deploy anywhere. Only the frontend (Vercel) deploys.

**What must be done:**
- Provision a Railway or Render account/project for the backend (free tier, per the blueprint's tech stack).
- Implement the actual deploy step — either via the Railway CLI, Render's deploy hook URL, or the platform's native GitHub integration (preferred if available, as it requires zero workflow code).
- Add any required secrets (deploy tokens, webhook URLs) to GitHub Actions secrets.
- Confirm the backend is actually live and reachable at a public URL after a deploy runs.
- Confirm the frontend's API base URL points to this live backend URL in production (check environment variable configuration on Vercel).

---

### 2.6 — HANDOVER.md Is Missing, and the Project Was Declared "Final" Without It

**What was found:** No `HANDOVER.md` exists anywhere in the repository, despite the blueprint mandating it exist throughout development and only be deleted as the explicit, deliberate signal that the project is complete (Section 0 of the blueprint). The most recent commit is titled `[PHASE-9 / FINAL] Complete Testing & CI/CD pipeline. Project finished.` — but there is no audit trail showing this was verified, and as this document demonstrates, the project is not actually finished.

**What must be done:**
- Recreate `HANDOVER.md` at the repository root immediately, using the structure defined in the blueprint Section 0.
- Use it honestly: state clearly that a prior "final" commit was premature, that this remediation is in progress, and list the real current state.
- Continue updating it after every fix in this document until Section 5's checklist passes completely.
- Only then follow the deletion step in Section 6 of this document.

---

### 2.7 — File Upload Has No Size Limit or Type Restriction

**What was found:** In `orders.controller.ts`, Multer is configured as:
```javascript
export const upload = multer({ storage: storage });
```
No `limits` object (file size cap) and no `fileFilter` (MIME type whitelist) are configured. This means any authenticated user can currently upload files of unlimited size and any file type (including executables) as order attachments.

**What must be done:**
- Add a file size limit (e.g. 10MB per file — confirm a sensible number with reference to typical photo/document attachment sizes, and document the choice).
- Add a MIME type whitelist appropriate for order attachments (images: jpeg/png/webp, documents: pdf). Reject anything else with a clear error.
- Add a limit on the number of files per upload request.
- Move this Multer configuration out of `orders.controller.ts` and into a proper `upload.service.ts` as specified in the blueprint's file tree (Section 6), so it can be swapped for Cloudflare R2 in production without touching controller code.
- Write a test confirming an oversized file is rejected and a disallowed file type is rejected.

---

## SECTION 3: SIGNIFICANT GAPS

### 3.1 — Backend TypeScript Errors (34 total on `tsc --noEmit`)

**What was found:** Running `npx tsc --noEmit` in `apps/api` produces 34 errors. Most are implicit `any` type errors from missing type annotations on callback parameters (e.g. `src/config/database.ts`, `src/services/permissions.service.ts`, `src/services/dashboard.service.ts`, `src/controllers/payroll.controller.ts`, and others). One is a genuine type-safety issue:
```
src/services/assignments.service.ts(93,52): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
```

**What must be done:**
- Fix every single error from `tsc --noEmit` in `apps/api`. Zero errors is the bar, not "fewer errors."
- For implicit `any` errors, add explicit type annotations — do not silence them by adding `: any` everywhere, as that defeats the purpose of TypeScript. Use the actual inferred or correct type.
- For the `assignments.service.ts` error specifically, trace why the value is `unknown` and add a proper type guard or assertion with justification, not a blind cast.
- Enable `strict: true` in `apps/api/tsconfig.json` if not already enabled, to prevent this class of error from recurring.
- The frontend (`apps/web`) currently typechecks with zero errors — confirm this is still true after any shared-package changes, and keep it that way.

---

### 3.2 — Orders Module Missing Kanban and Calendar Views

**What was found:** No file matching `*Kanban*` or `*Calendar*` exists anywhere in `apps/web/src`. Only the table view (`OrdersTable.tsx`) exists. The blueprint specifies three views for orders: Table, Kanban (drag-and-drop status change via dnd-kit), and Calendar (orders plotted by delivery date).

**What must be done:**
- Implement `OrdersKanban.tsx` using dnd-kit, exactly as the blueprint specifies — cards grouped by status, drag a card to change its status (which must call the actual status-update API, not just move visually).
- Implement `OrdersCalendar.tsx` — orders plotted on their delivery date, clicking a day shows that day's orders.
- Add a view switcher in the Orders page UI to toggle between Table / Kanban / Calendar.
- Confirm permission and edit-window rules (from 2.1 above) are respected in the Kanban drag interaction too — a user without permission to edit an order, or whose edit window has expired, should not be able to drag that card to a new status.

---

### 3.3 — Payroll "Advances" Module Is Missing

**What was found:** No file related to advances (employee salary advances/deductions) exists. The blueprint's Payroll Module includes an Advances sub-module: tracking money given early or withheld, linked to a payroll period.

**What must be done:**
- Implement the `advances` table interactions: CRUD service, controller, routes (`GET/POST /api/advances`, `DELETE /api/advances/:id`) matching the blueprint's API reference (Section 7).
- Implement `AdvancesTable.tsx` on the frontend.
- Ensure advances correctly factor into the net salary calculation for the linked payroll period (gross salary minus deductions, where deductions include any advances tied to that period).

---

### 3.4 — System-Wide Audit Log Is Missing (Only Order-Level Exists)

**What was found:** Only `orderAuditLog.service.ts` exists, which logs changes to individual orders. The blueprint also specifies a separate `system_audit_log` table and module (Section 5, Module 11) that captures every create/update/delete across the **entire system** — user management, settings changes, status/field changes, payroll changes, FB account changes — not just order edits. This is explicitly required to be non-deletable and viewable only by Admin.

**What must be done:**
- Implement the `system_audit_log` table per the blueprint schema (Section 5) if it does not already exist in `schema.prisma` — confirm first, as this may exist in the schema even if no service uses it yet.
- Implement `audit.service.ts`, `audit.controller.ts`, `audit.routes.ts` (`GET /api/audit` with filters by user, action type, entity type, date range) per the blueprint's API reference.
- Wire this into the `auditLogger.ts` middleware (which exists) so that it actually writes to `system_audit_log` on every mutating request, not just orders.
- Confirm the audit log records cannot be deleted by any role, including Admin, at the API level (no DELETE route should exist for this resource at all).
- Build the Admin-facing audit log page (`audit-log.tsx`) if not already present, with filtering and export to PDF/Excel.

---

### 3.5 — Upload and PDF Generation Logic Lives in Controllers, Not Services

**What was found:** Multer configuration lives directly in `orders.controller.ts`. PDFKit document generation lives directly in `payroll.controller.ts`. The blueprint's architecture (Section 6, 12) requires this logic to live in dedicated services (`upload.service.ts`, `export.service.ts`) specifically so the underlying implementation (e.g. local disk → Cloudflare R2) can be swapped without touching route or controller code.

**What must be done:**
- Move file upload handling into `upload.service.ts` (also addresses 2.7 above — do this as one piece of work).
- Move PDF generation logic into `export.service.ts`, alongside the Excel export work from 2.3.
- Controllers should call these services and not contain implementation details of storage or document generation directly.
- This is an architectural correctness fix, not just a cosmetic one — confirm the existing functionality (salary slip PDF, order attachment upload) still works identically after the refactor.

---

### 3.6 — Extremely Low Commit Granularity

**What was found:** The entire project history contains 11 commits, spanning what is claimed to be 9 phases and 48+ individual build steps as defined in the blueprint's Build Order (Section 9). The blueprint mandates a commit after every completed step, with a specific commit message format, specifically so that any issue can be traced to the exact point it was introduced and so that work is never lost in large unverified batches.

**What must be done:**
- This cannot be retroactively fixed for past work, but it must be corrected going forward.
- Every fix in this document must be committed individually, immediately upon completion and verification, following the commit format defined in the blueprint (Section 0): `[PHASE-X / STEP-Y] description`, with this remediation work labeled clearly, e.g. `[REMEDIATION] Fix edit window enforcement`.
- Do not batch multiple unrelated fixes from this document into a single commit. Each numbered item in Section 2 and Section 3 of this document should correspond to at least one commit, ideally with its own test included in the same commit.

---

## SECTION 4: ITEMS REQUIRING VERIFICATION

These items could not be confirmed broken or working in the prior audit due to environment limitations (no live database connection, no Prisma client generation, no running server). They must be properly verified now, in an environment with full access, and fixed if found broken.

### 4.1 — Confirm the Prisma Client Generates Cleanly and Matches the Schema
Run `npx prisma generate` and `npx prisma migrate deploy` against a real PostgreSQL instance. Confirm zero errors. Confirm `tsc --noEmit` in `apps/api` shows zero Prisma-related type errors (e.g. missing exported members like `User` or `Role` — these were observed in the audit but attributed to a stale/ungenerated client in the audit sandbox; re-confirm this is not a real schema issue).

### 4.2 — Confirm All Tests Actually Pass, Not Just Exist
The test files in `apps/api/src/__tests__/` were confirmed to exist with substantive content (519 lines total across 6 files), but they were not executed in the prior audit due to lack of a live database/Redis connection. Run the full test suite (`npm run test` in `apps/api`) against properly configured test infrastructure and confirm 100% of tests pass with zero failures and zero skipped tests.

Additionally:
- The current test script is `jest --passWithNoTests`. This flag means CI would pass even if all tests were deleted or somehow failed to load. Once you've confirmed real tests exist and pass, consider whether this flag should remain (it's reasonable during active development, but for a project being declared "complete," CI should also enforce a minimum test count or coverage threshold, not just "don't crash if there are no tests"). Add a coverage check or explicit test-count assertion in CI if not already present.
- Add tests for every item fixed in Section 2 and 3 of this document — this is not optional, it's part of completing each fix.

### 4.3 — Confirm Frontend Tests Exist and Run
The CI workflow (`ci.yml`) has frontend tests commented out:
```yaml
# - name: Run Tests (Web)
#   run: npm run test -w @nexacrm/web
```
Determine whether frontend tests exist at all in `apps/web`. If they do not exist, this is itself a gap — the blueprint does not explicitly mandate frontend test coverage as heavily as backend, but a project declared 100% complete and tested should have at least basic component/integration tests for critical user flows (login, order creation, permission-gated UI elements). Write these if missing, then uncomment and fix this CI step so it actually runs.

### 4.4 — Confirm Module Toggles Actually Hide Sidebar Items
The blueprint requires that disabling the Payroll or FB Accounts module in Settings immediately hides the corresponding sidebar navigation for all users, without requiring a redeploy. Verify this works in a live running instance — toggle each module off, confirm the sidebar item disappears for both Admin and User roles, confirm direct navigation to the route (e.g. typing `/payroll` in the URL bar) is also blocked when the module is off, not just hidden from the sidebar.

### 4.5 — Confirm the "Since You Were Gone" / Dashboard Catch-Up Feature Works End to End
This feature relies on the `previous_login` timestamp logic described in the blueprint (Section 12, point 16). Confirm: the `users` table has both `last_login` and `previous_login` columns, the login flow correctly shifts the old `last_login` into `previous_login` before updating `last_login`, the `/api/auth/me` response returns `previousLoginAt`, and the dashboard widgets (`SinceYouWereGoneBanner.tsx`, `NewEntriesWidget.tsx`, `MyRecentOrdersWidget.tsx`) correctly use this value to filter and display the right data for both Admin and User roles as specified.

### 4.6 — Confirm Global Search Actually Searches All Required Entity Types
`GlobalSearchModal.tsx` and `Topbar.tsx` exist, confirming a frontend Cmd+K UI is present. Verify the backend `search.service.ts` and `search.routes.ts` actually search across orders, users (Admin-scope only), statuses, and announcements as specified — not just orders. Confirm Admin-only entities are not returned to non-Admin users in search results.

### 4.7 — Confirm Email Notifications Actually Send and Trigger Correctly
`email.ts` (Nodemailer setup) exists and is correctly configured to read SMTP settings from environment variables. Verify this is actually triggered on the correct events: order status changed, order assigned, account modified, announcement posted, temporary permission expiring soon — per the blueprint's Notification Settings (Section 3, Module 6/7). Confirm a real test email sends successfully in a properly configured environment, and confirm the per-event-type email toggle in Settings actually suppresses emails when turned off.

### 4.8 — Confirm Soft Deletes Are Applied Consistently
The blueprint requires soft deletes (via `deletedAt`) on orders, users, and statuses, with Prisma middleware automatically filtering `deletedAt: null` on all default queries. Verify this middleware exists and is applied globally, not just implemented ad hoc in individual service methods. Confirm a "deleted" order does not appear in any list/search/export, but can still be queried directly by ID for recovery purposes by an Admin.

### 4.9 — Confirm Effective Permissions Caching and Invalidation Works Correctly
Verify the Redis-based permission caching described in the blueprint (Section 12, point 5) is correctly invalidated whenever a user's policies, group memberships, or role change — not just on login. Test scenario: log in as a user, have an Admin (in a separate session) revoke a permission from that user's group, and confirm the change takes effect within the cache's TTL window or immediately via explicit invalidation — not after a full re-login.

---

## SECTION 5: FULL VERIFICATION CHECKLIST (MUST PASS 100%, NO EXCEPTIONS)

Do not consider this project complete until every single line below is confirmed true by actually running the check, not by inspection alone where a runtime check is possible.

**Build & Type Safety**
- [ ] `npx tsc --noEmit` in `apps/api` returns zero errors
- [ ] `npx tsc --noEmit` in `apps/web` returns zero errors
- [ ] `npm run build` succeeds for both `apps/api` and `apps/web` with zero errors
- [ ] `npx prisma generate` succeeds with zero errors against the actual schema
- [ ] `npx prisma migrate deploy` succeeds against a real PostgreSQL instance with zero errors

**Tests**
- [ ] Full backend test suite runs and passes 100% — zero failures, zero skipped
- [ ] Every item fixed in Section 2 has a corresponding passing test
- [ ] Every item fixed in Section 3 has a corresponding passing test where applicable
- [ ] Frontend tests exist for at minimum: login flow, order creation, permission-gated UI rendering
- [ ] CI workflow runs both backend and frontend tests with nothing commented out

**Security**
- [ ] Edit window enforcement confirmed working (Section 2.1) — tested with both expired and active windows, both USER and ADMIN roles
- [ ] File upload size limit and type whitelist confirmed working (Section 2.7)
- [ ] SQL injection attempted against search and filter fields — confirmed harmless (Prisma parameterization)
- [ ] XSS attempted against all rich text and notes fields — confirmed sanitized (DOMPurify)
- [ ] Admin-only routes confirmed to return 403 when accessed with a USER token
- [ ] Editing another user's order as a USER confirmed to return 403
- [ ] Expired temporary permission confirmed to be rejected, not silently allowed
- [ ] Account lockout after 5 failed logins confirmed working
- [ ] No secrets, credentials, or API keys found anywhere in the codebase or git history
- [ ] CORS confirmed locked to the production frontend domain only, not wildcarded

**CI/CD**
- [ ] Confirmed via actual test (breaking a test intentionally on a branch) that a failing CI run blocks deployment
- [ ] Confirmed frontend deploys successfully to Vercel
- [ ] Confirmed backend deploys successfully to Railway or Render and is reachable at a public URL
- [ ] Confirmed production environment variables are correctly set on both platforms
- [ ] Confirmed production database migrations run automatically or via a documented manual step as part of deploy

**Feature Completeness**
- [ ] Smart paste parser implemented and tested (Section 2.2)
- [ ] Excel export implemented and tested for orders and payroll (Section 2.3)
- [ ] Kanban view implemented and functional (Section 3.2)
- [ ] Calendar view implemented and functional (Section 3.2)
- [ ] Payroll Advances module implemented and tested (Section 3.3)
- [ ] System-wide audit log implemented, non-deletable, and Admin-viewable (Section 3.4)
- [ ] Module toggles (Payroll, FB Accounts) confirmed to hide both sidebar nav and block direct route access when off (Section 4.4)
- [ ] Since You Were Gone / dashboard catch-up feature confirmed working for both roles (Section 4.5)
- [ ] Global search confirmed to search orders, users, statuses, and announcements, with Admin-only scoping respected (Section 4.6)
- [ ] Email notifications confirmed to send on all specified events and respect per-event toggles (Section 4.7)
- [ ] Soft delete middleware confirmed applied globally and consistently (Section 4.8)
- [ ] Permission cache invalidation confirmed to work immediately on policy/group/role change, not just on re-login (Section 4.9)

**Process & Documentation**
- [ ] `HANDOVER.md` exists and accurately reflects current state throughout remediation
- [ ] Every fix in this document has its own dedicated commit, following the `[PHASE-X / STEP-Y]` or `[REMEDIATION]` message format
- [ ] `README.md` is accurate and a fresh clone can be set up locally by following it exactly, with zero undocumented steps

---

## SECTION 6: FINAL COMPLETION PROTOCOL

Only after every single checkbox in Section 5 is confirmed true:

1. Do one final full pass — re-read this entire document from the top and re-verify nothing was missed.
2. Update `HANDOVER.md` one last time with a clear statement that all remediation items have been fixed, verified, and tested, and that the verification checklist in Section 5 of this document passed completely.
3. Commit this final HANDOVER.md update.
4. Delete `HANDOVER.md` from the repository, following the exact procedure in the original blueprint (Section 0):
```bash
git rm HANDOVER.md
git commit -m "[REMEDIATION / FINAL] All gaps closed, full verification passed. Project complete."
git push origin main
```
5. The deletion of `HANDOVER.md` remains the only valid signal that this project is genuinely complete. Do not delete it prematurely. Do not declare the project complete in a commit message while `HANDOVER.md` still exists or while any item in Section 5 is unchecked.

**No agent should consider this project finished, production-ready, or safe to hand over to the client until this entire protocol has been followed and Section 5 passes with zero exceptions.**
