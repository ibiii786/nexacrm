# NexaCRM — Fix List (Half 1 Cleanup)

## READ THIS FIRST

This document fixes 4 specific, confirmed issues found during a review of Half 1's completed work. Some of this work was based on your own idea (default permissions for users/admins, with admins unable to create other admins) — that idea is correct and worth keeping, but the implementation has real bugs that need fixing, and the underlying permission system doesn't actually support "admin minus create-admin" the way it was attempted. This document fixes that properly.

Same rules as before: one item at a time, stop and verify after each one, one commit per item, do not move to the next item until told to proceed.

---

## ITEM 1 — Admins should not be able to create other Admins (this needs real role-based logic, not a permission)

**The problem, exactly:** The permission system (`packages/shared/src/constants/permissions.ts`) has no permission representing "create an admin" specifically — `users:manage` is the only relevant permission and it covers creating, editing, suspending, and managing users generically, with no distinction by target role. This means the idea of "admins get every permission except creating other admins" cannot be expressed as a permission exclusion, because that specific permission doesn't exist to exclude. Additionally, right now, **there is no restriction anywhere in the code** preventing an ADMIN from creating another ADMIN or even another SUPER_ADMIN — any user with `users:manage` can currently set any role on a new user with no check at all.

**The fix:** This must be enforced as explicit role-based logic in the user-creation code, not as a permission. In `apps/api/src/services/users.service.ts`'s `createUser` method (or wherever the role-setting actually happens), add a check: if the requesting user's role is `ADMIN` (not `SUPER_ADMIN`) and the role being assigned to the new user is `ADMIN` or `SUPER_ADMIN`, reject the request with a clear error (e.g. `FORBIDDEN_ROLE_ESCALATION`, "Only a Super Admin can create Admin accounts"). `SUPER_ADMIN` requesters can create users of any role, including other Admins. This check must happen on the backend regardless of what the frontend shows or hides — verify this by testing directly against the API, not just through the UI.

On the frontend (`UserModal.tsx` or wherever the role dropdown for creating a user lives), if the person creating the user is an `ADMIN` (not `SUPER_ADMIN`), the role dropdown should not offer `ADMIN` or `SUPER_ADMIN` as options at all — only `USER`. This is a UX nicety on top of the real backend enforcement, not a substitute for it.

**Verification:**
1. As `SUPER_ADMIN`, create a new user with role `ADMIN`. Confirm it succeeds.
2. As that new `ADMIN`, attempt to create another user with role `ADMIN` through the real UI. Confirm the role option isn't even offered, or if it somehow is, confirm submitting it is rejected.
3. As that `ADMIN`, attempt the same thing by calling the API directly (bypassing the UI) with role `ADMIN` in the request body. Confirm the backend rejects it with a clear error, proving this isn't just a frontend-only restriction.
4. As that `ADMIN`, create a new user with role `USER`. Confirm this still works normally.

Commit message: `[FIX] Item 1 — Prevent Admins from creating other Admin accounts via explicit role check`

**STOP HERE. Do not continue to Item 2 until told to proceed.**

---

## ITEM 2 — Default permission assignment has a bad coding pattern and needs cleanup

**The problem, exactly:** In `apps/api/src/services/users.service.ts`, the default permission assignment logic uses `require('@nexacrm/shared')` instead of a normal `import` statement, with a comment acknowledging this is unusual. Every other file in this codebase uses ES `import` syntax consistently. This doesn't currently crash (the project compiles to CommonJS), but it's inconsistent and should be cleaned up properly rather than left as a workaround.

**The fix:** Replace the `require('@nexacrm/shared')` call with a normal top-of-file `import { DEFAULT_USER_PERMISSIONS } from '@nexacrm/shared';`, exactly matching how other imports from this package already look in this same file (check the existing imports at the top of `users.service.ts` for the exact pattern already used) and in other files across the codebase. Remove the comment explaining the workaround, since it will no longer be necessary.

While in this file for this fix, also re-confirm the actual permission-assignment logic itself is correct: ADMIN and SUPER_ADMIN should get every permission currently defined in `ALL_PERMISSIONS`, and USER should get exactly `DEFAULT_USER_PERMISSIONS`. Do not change this part of the logic unless you find it's actually wrong — this fix is about the import style, not the permission selection itself (that's expected to keep working as your own original idea intended, now that Item 1 has separately closed the create-admin gap).

**Verification:**
1. Run `npx tsc --noEmit` in `apps/api` and confirm no new errors were introduced, and confirm the specific `require()`-related code no longer exists if you search for it.
2. Create a new `USER` and a new `ADMIN` through the real UI. Check their assigned permissions (via the Effective Permissions view in Admin, or directly in the database) and confirm they still match what they did before this change — `USER` gets `DEFAULT_USER_PERMISSIONS`, `ADMIN` gets everything in `ALL_PERMISSIONS`.

Commit message: `[FIX] Item 2 — Replace require() with proper ES import for DEFAULT_USER_PERMISSIONS`

**STOP HERE. Do not continue to Item 3 until told to proceed.**

---

## ITEM 3 — Duplicate order prevention has a real bug interacting with the Undecided default status

**The problem, exactly:** In `apps/api/src/services/orders.service.ts`, the duplicate-order-prevention logic checks for an identical order created in the last 5 minutes, but only among orders with the same `statusId`. Since the Undecided status (added earlier) is now the default for any order with no status specified — which includes every Smart-Pasted order where the pasted text has no status line — two different real customers, both pasted within 5 minutes of each other with no status info, both empty notes, and both no delivery date, risk being incorrectly flagged as duplicates of each other even though they are completely different orders for different people.

**The fix:** The duplicate check needs at least one more distinguishing signal beyond status, notes, and delivery date, since "Undecided + no notes + no delivery date" will be a very common combination, not a rare one, given the new default. Add a check on the actual order content that's far more likely to be genuinely identical only for true duplicates — specifically, compare the `customerName` and `customerPhone` values (or whichever custom field keys those map to) in addition to the existing checks, since two different real customers will essentially never share both an identical name and an identical phone number, but easily could share an empty notes field and no delivery date. If `customerName` or `customerPhone` data isn't reliably available at the point this check runs (e.g. it's still in `customFields` and not yet validated/normalized), find the correct place in the order creation flow to extract and compare these two specific values, and use them as the primary duplicate signal alongside the existing status/notes/deliveryDate check, not as a replacement for it.

Also reconsider the 5-minute window: a customer support workflow can legitimately involve creating two genuinely separate, unrelated orders for the same returning customer within a short window (e.g. correcting a typo by deleting and recreating, or a customer ordering twice). Keep the time window as a contributing signal, not a single point of failure — the fix above (requiring name+phone match too) should make this much safer regardless of window length, but use your judgment on whether 5 minutes is still reasonable or should be shortened given the added specificity, and explain your choice.

**Verification:**
1. Using Smart Paste, create two orders for two different fictional customers (different names, different phone numbers), both with no status specified, both within the same few minutes, both with empty notes and no delivery date. Confirm both are successfully created and neither is rejected as a duplicate.
2. Using Smart Paste, paste the exact same order text twice in a row, within a minute of each other. Confirm the second submission is correctly rejected as a duplicate.
3. Confirm the error message shown to the user when a genuine duplicate is caught is still clear and understandable.

Commit message: `[FIX] Item 3 — Require matching customer name and phone for duplicate order detection, not just status/notes/date`

**STOP HERE. Do not continue to Item 4 until told to proceed.**

---

## ITEM 4 — Restore deleted documentation files and remove stray debug test scripts

**The problem, exactly:** `CRM_Remediation_Mandate.md` and `QA_Verification_Protocol.md` were deleted from the repository root in a recent commit, with no instruction anywhere authorizing this. These are permanent project reference documents recording real audit history and should not have been removed. Separately, 8 loose debugging scripts (`test_auth.ts`, `test_backend.ts`, `test_create_local.ts`, `test_create_real.ts`, `test_item_3.js`, `test_order.ts`, `test_parser_fix.ts`, `test_paste.ts`, `test_stage1.ts`, `test_stage8.ts`) were committed directly into `apps/api/`, outside the project's actual test directory (`apps/api/src/__tests__/`) — these are clearly ad-hoc scratch files from a debugging session and should not be committed as part of the application source.

**The fix:**
1. Restore `CRM_Remediation_Mandate.md` and `QA_Verification_Protocol.md` to the repository root, exactly as they were before deletion (`git log` and `git show` against the commit before they were deleted to recover the exact original content, rather than recreating them from memory or guessing).
2. Delete the 8 loose test scripts listed above from `apps/api/`. If any of them contain a genuinely useful, non-duplicate test case that isn't already covered by the real test suite in `apps/api/src/__tests__/`, move that specific test logic into a properly named, properly located file inside `apps/api/src/__tests__/` instead of just deleting it outright — use your judgment on whether any of them are worth preserving in proper form, but do not leave any of them sitting loose in `apps/api/` regardless.
3. Add a note to `.gitignore` for any common debug-script naming pattern you think is likely to recur (e.g. `test_*.ts` at the root of `apps/api/`, outside the real test directory) so this doesn't silently happen again in a future session — but be careful this pattern doesn't accidentally also match legitimate files inside `apps/api/src/__tests__/`, which use a different naming convention and must continue to be tracked normally.

**Verification:**
1. Confirm both deleted markdown files are back in the repository root with their original content intact (spot-check a few sections against what you recovered from git history).
2. Confirm none of the 8 loose test scripts remain anywhere in `apps/api/` outside the proper test directory.
3. Run the full real test suite (`npm run test` in `apps/api`) and confirm it still runs and nothing that was passing before is now broken by this cleanup.

Commit message: `[FIX] Item 4 — Restore deleted documentation files and clean up stray debug scripts from apps/api`

**STOP HERE. This is the last item in this document. Wait for further instruction before doing anything else — including before starting Half 2 or any deployment work.**

---

## RULES FOR THIS DOCUMENT

- One item at a time, in order. Stop and verify after each one. Do not move to the next item without being told to proceed.
- One commit per item, using the exact commit message given.
- Do not touch anything outside the 4 items listed here, even if you notice other things that look wrong — note them instead, don't fix them now.
- If you find that part of an item is already correctly handled, say so honestly in your commit message rather than redoing work that doesn't need it.
- If you have to stop partway through, update HANDOVER.md stating exactly which item you're on.
