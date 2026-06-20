# NexaCRM — Sequential Implementation & Whole-App Logic Audit

## READ THIS FIRST

This document has two halves. Read both before starting either.

**Half 1** is the Smart Paste / Copy feature work that was already specified in a separate document. It is included here, unchanged in substance, because it must be done first and gated — see "How This Document Works" below.

**Half 2** is a full, sequential, page-by-page audit of the rest of the application, specifically hunting for a category of bug that was missed in an earlier QA pass: bugs that don't live behind any button click, but exist in what a page shows by default, before anyone touches anything. Two confirmed, real examples of this exact category were found before this document was written (see "Known Confirmed Issues" below) — they are not hypothetical, they are already verified against the real code.

---

## WHY THIS DOCUMENT EXISTS AND HOW IT IS DIFFERENT FROM THE LAST ONE

A previous QA document asked a model to test every feature in the app — click every button, fill every form, check every permission. That document caught real bugs and the fixes were good. But it had a structural blind spot: it tested whether features *worked when used*, not whether the *default, untouched state* of each page made sense. A page can have zero broken buttons and still be fundamentally broken if what it shows the moment it loads — before any click — is wrong.

Two confirmed examples of exactly this, found by directly reading the live code before this document was written:

1. **The Orders page has no default date filter and no pagination, anywhere — frontend or backend.** `OrdersPage.tsx` initializes `startDate` and `endDate` as empty strings and fetches with those empty values on every load. `orders.service.ts` and `orders.controller.ts` on the backend have zero `limit`/`take`/`skip` logic at all. This means every single time anyone logs in and opens Orders — the single most important page in the entire application — it fetches and renders **every order that has ever been created**, with no cap, forever. This will get slower every single day the business uses the software, and it directly contradicts the intended "Today / This Week" filtered experience described in the original blueprint. This is not a missing nice-to-have. This is a core defect in the core feature of the product.

2. **The regular, manual "Create Order" modal (`OrderModal.tsx`) has the identical duplicate-field architecture bug** that was already found and fixed in the Smart Paste modal specifically — it renders hardcoded Status/Delivery Date inputs and then separately loops over `statusFields` with no awareness that some of those fields might be the same ones already rendered above. The earlier fix only patched the Smart Paste version of this form. The much more commonly used manual form was never touched and still has the bug today.

These two were found by deliberately reading default state and tracing data flow, not by clicking buttons. This document exists to force that same kind of reading — page by page, sequentially, methodically — across the entire rest of the app, instead of relying on a feature checklist that can only catch what it explicitly thinks to ask about.

---

## HOW THIS DOCUMENT WORKS — READ THIS CAREFULLY, THIS IS NOT OPTIONAL

This document is split into numbered Stages. **You complete exactly one Stage, then you stop completely and wait for an explicit instruction to continue.** Do not move to the next Stage on your own. Do not assume permission to continue. Do not say "I'll continue with the next stage now" and keep working — stop, report what you did in the Stage you just finished, and end your turn.

When you receive the message "proceed", you continue with the next Stage, following the exact same rule: finish that one Stage, stop, wait again.

This applies all the way through the document, including inside Half 2's page-by-page audit — each individual page audited is its own Stage. You do not move from auditing Page 1 to auditing Page 2 without being told to proceed, even though both are technically part of "Half 2."

The reason for this rule: previous large pieces of work done in this project went wrong specifically when a lot of changes were made in one uninterrupted pass with no checkpoint for a human to verify progress before more changes piled on top. This document removes that risk by making every single unit of work a hard stop.

At the end of every Stage, before stopping, you must:
1. State clearly what you found (if auditing) or what you changed (if fixing).
2. State the exact verification you personally performed in the real running app — not "I read the code and it looks right."
3. Commit your work for that Stage alone, with the exact commit message format given for that Stage.
4. Update `HANDOVER.md` (create it if it doesn't exist) stating exactly which Stage was just completed and which Stage is next.
5. Stop. Do not start the next Stage's work, even partially.

---

# HALF 1 — SMART PASTE AND COPY FUNCTIONALITY

This is the same scope as before. It is broken into Stages here so it follows the stop-and-wait rule properly. Do not deviate from what's written here.

## Stage 1 — Fix the duplicate fields bug in the Smart Paste modal

Read `apps/web/src/components/orders/OrderPasteParser.tsx` in full first.

The problem: This form hardcodes a Status dropdown and a Delivery Date input, then separately renders every field returned by `statusFields` in a loop further down. If any of those status-attached fields happen to be the same as a standard field already hardcoded above, they render twice.

The fix: Before rendering the `statusFields.map(...)` loop, filter out any field whose `name` matches a standard field name that already has a dedicated, hardcoded input elsewhere in this form. Import `STANDARD_FIELDS` from `packages/shared/src/constants/fieldTypes.ts` and derive the exclusion set from its `name` values (customerName, orderNumber, orderStatus, customerPhone, deliveryAddress, orderDate, deliveryDate, productsOrdered, price, paymentStatus, notes, createdBy) — do not hardcode a second separate list inside the component.

Verification: Open the real running app, go to Create Order via Smart Paste, select a status that has custom fields attached (create one temporarily for testing if none exist), and confirm Status and Delivery Date each appear exactly once, with no duplicates.

Commit message: `[FIX] Stage 1 — Remove duplicate standard fields from Smart Paste custom fields loop`

**STOP HERE. Do not continue to Stage 2 until told to proceed.**

---

## Stage 2 — Fix the identical duplicate fields bug in the regular manual Create Order modal

Read `apps/web/src/components/orders/OrderModal.tsx` in full first. This is a different file from Stage 1, used for normal (non-paste) order creation, and it independently has the same architectural bug — it was not touched by the Stage 1 fix.

Apply the exact same fix as Stage 1, to this file: filter the `statusFields.map(field => ...)` loop (around the location where `statusFields` is used to render fields) using the same `STANDARD_FIELDS`-derived exclusion set. Do not write a third, different version of this filtering logic — if it's reasonable to extract the filtering into one small shared helper function used by both `OrderPasteParser.tsx` and `OrderModal.tsx` instead of duplicating the same filter logic in two places, do that; if extracting it adds more complexity than it saves given how these two components are structured, it's acceptable to apply the same filter inline in both, your judgment, but state which approach you took and why in your Stage report.

Verification: Open the real running app, click the regular "Create Order" button (not Smart Paste), select a status with custom fields attached, and confirm Status and Delivery Date each appear exactly once.

Commit message: `[FIX] Stage 2 — Remove duplicate standard fields from manual Create Order modal`

**STOP HERE. Do not continue to Stage 3 until told to proceed.**

---

## Stage 3 — Alias mapping and price parsing fix in the paste parser

Read `apps/api/src/utils/pasteParser.ts` in full first.

The client's real, fixed order format:
```
Name: Adrian kozakiewicz
Contact: 4169967757
ADDRESS: 113 surbray grive mississauga 
Products: 1x Double Size 12" Thick Anna plus mattress 
Total : 250$
```

1. Add an explicit alias lookup table, checked BEFORE the existing exact-match / contains-match / Levenshtein logic inside `matchField()`:
   - "Name", "Contact Name" → customerName
   - "Contact", "Contact Number", "Phone" → customerPhone
   - "ADDRESS" (any casing) → deliveryAddress
   - "Products", "Product" → productsOrdered
   - "Total", "Total Price", "Amount" → price
   Implement as a `Record<string, string>` mapping lowercased alias text to the standard field's `name`, checked case-insensitively, resolved against the actual `FieldDefinition` list passed into the parser. This runs first as a fast exact shortcut; the existing fuzzy logic still applies afterward for anything not in this table, since Admin-created custom fields still need that flexibility.
2. Verify `normalizeCurrency()` correctly strips a trailing `$` (the sample has "250$", not "$250") with a real test, not an assumption — only change the regex if a real test proves the current one is wrong.
3. Write or update tests in `apps/api/src/__tests__/services/pasteParser.test.ts` using the exact sample text above, asserting all five fields map and normalize correctly (price → "250"), with zero entries in `unknownFields`.

Verification: Run the test and confirm it passes. Then paste the exact sample text into the real running Smart Paste modal and confirm all five fields pre-fill with no unrecognized-field prompts.

Commit message: `[FEATURE] Stage 3 — Add alias mapping to smart paste parser for common label variants`

**STOP HERE. Do not continue to Stage 4 until told to proceed.**

---

## Stage 4 — Add the "Undecided" default status

The problem: There is currently no status representing "this order was just added and nobody has decided what to do with it yet." The current default is "Confirmed", which is wrong for orders with no status information in the pasted text.

1. In `packages/shared/src/constants/defaultStatuses.ts`, add a new entry: name "Undecided", a neutral grey color, an appropriate icon matching the existing icon naming convention in this file, and `isDefault: true`. Set `isDefault: false` on "Confirmed". Confirm exactly one status has `isDefault: true` after this change.
2. Check `apps/api/prisma/seed.ts`'s idempotent upsert logic for statuses and confirm running the seed again correctly adds "Undecided" and flips the `isDefault` flags without creating a duplicate "Confirmed" entry or leaving two statuses marked default at once. Fix the seed logic if it doesn't handle this correctly for an already-seeded database.
3. Confirm — by reading `orders.service.ts`'s order creation logic, not by assuming — that both manual order creation and Smart Paste order creation use whichever status currently has `isDefault: true` as their fallback, so this one change correctly affects both creation paths without needing separate logic in each.

Verification: Paste the client's sample order (no status line) into Smart Paste and confirm the Status dropdown defaults to "Undecided". Create a normal order manually and confirm it also defaults to "Undecided" now. As Admin, manually change an order's status afterward and confirm that still works.

Commit message: `[FEATURE] Stage 4 — Add Undecided default status for orders with no status specified`

**STOP HERE. Do not continue to Stage 5 until told to proceed.**

---

## Stage 5 — Copyable fields setting and copy-as-text button (backend)

1. Add two columns to the `Field` model in `apps/api/prisma/schema.prisma`:
   - `isCopyable Boolean @default(true) @map("is_copyable")`
   - `copyPosition Int? @map("copy_position")`
   Generate and apply the migration.
2. In `apps/api/prisma/seed.ts`, set `isCopyable: false` specifically for the `createdBy` standard field (internal-only, must never be shared externally with customers), and `true` for all other standard fields. Add a code comment explaining why.
3. Update the fields CRUD service/controller/routes to accept and return `isCopyable` and `copyPosition`.
4. Add a new endpoint `GET /api/orders/:id/copy-text` that returns plain text: every field where `isCopyable` is true, sorted by `copyPosition` (nulls last, tiebroken by normal `position`), formatted as `"Label: value"` per line, skipping fields with no value on this order. Read both native Order columns and the `custom_fields` JSON the same way the existing order detail endpoint already assembles a full field view — reuse that pattern, don't build a second one. This endpoint must enforce the same view permissions as viewing the order normally.

Verification: Create an order via Smart Paste using the client's sample text. Call the new endpoint directly (or via a temporary frontend test) and confirm the returned text excludes "Created By" and matches the original input shape.

Commit message: `[FEATURE] Stage 5 — Add copyable fields schema and copy-text generation endpoint`

**STOP HERE. Do not continue to Stage 6 until told to proceed.**

---

## Stage 6 — Copyable fields setting and copy-as-text button (frontend)

1. In `FieldsSettings.tsx` / `FieldModal.tsx`, add to the field edit UI: a toggle "Include in copied order text" bound to `isCopyable`, and a way to set `copyPosition` (a simple number input is acceptable; reuse the existing dnd-kit drag-and-drop pattern from `StatusesSettings.tsx` only if it's quick to adapt — check that implementation first rather than building a second different drag-and-drop mechanism).
2. Add a "Copy" button to the order detail view (`OrderDetailPage.tsx` or equivalent). Clicking it calls `GET /api/orders/:id/copy-text`, copies the result to the clipboard via the browser clipboard API, and shows a success toast using whatever toast pattern (e.g. react-hot-toast) is already used elsewhere in this app.

Verification: Create an order via Smart Paste using the client's sample text, open it, click Copy, paste the clipboard contents into a text editor, and confirm it matches the original "Label: value" format with Created By excluded. As Admin, toggle a field's copyable setting off and confirm copying that order again reflects the change. Change two fields' copy order and confirm the copied text order changes.

Commit message: `[FEATURE] Stage 6 — Add copyable fields Settings UI and Copy button on order detail`

**STOP HERE. Do not continue to Stage 7 until told to proceed.**

---

## Stage 7 — Fix the unbounded Orders fetch (no pagination, no default date range)

This is the most severe confirmed issue in this entire document and must be fixed carefully.

The problem, confirmed by reading the real code: `apps/web/src/pages/orders/OrdersPage.tsx` initializes `startDate` and `endDate` as empty strings and fetches orders with those empty values by default. `apps/api/src/services/orders.service.ts` and `apps/api/src/controllers/orders.controller.ts` have no `limit`, `take`, `skip`, or any pagination logic at all. This means opening the Orders page fetches and renders every order ever created in the entire history of the system, every single time, with no cap. This gets slower every day the business uses the software and contradicts the filtered "Today / This Week" experience the rest of the product is designed around.

For contrast: `apps/web/src/pages/admin/AuditLogPage.tsx` already does this correctly — it sends a `limit` parameter by default. Use this as your reference for the pattern already established in this codebase, rather than inventing a new pagination approach.

The fix, backend first:
1. In `orders.service.ts`'s order-listing method and `orders.controller.ts`'s corresponding handler, add real pagination: accept `page` and `limit` query parameters (default `limit` to a reasonable number, e.g. 50, if not provided — check how `AuditLogPage`/its backend counterpart structures this and follow the same convention for consistency). Use Prisma's `skip`/`take` to actually enforce this at the database query level, not by fetching everything and slicing it in JavaScript afterward.
2. Return the total count alongside the page of results (check if a `meta: { page, total, limit }` response shape already exists elsewhere in this codebase per the API response conventions — if so, match it exactly).

The fix, frontend:
3. In `OrdersPage.tsx`, change the default `startDate`/`endDate` so the page does not load with an unfiltered "show everything" query. Default to a sensible recent window — "Today" is the most literal match to how the client described their workflow, but check whether "Last 7 days" reads better given the date-range filter options already built into the UI; pick whichever already-existing preset option in the date filter most naturally represents "default, not nothing", and use that as the initial state rather than empty strings. State clearly in your Stage report which default you chose and why.
4. Add pagination controls to the Orders table UI (page numbers or "load more", whichever is simpler to implement correctly given the existing `OrdersTable.tsx` structure) so a user can still reach older orders deliberately, rather than the date filter being the only way to see anything beyond the default window.
5. Make sure the existing date-range filter options (Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom range — check `DateRangeFilter.tsx` or equivalent for what's actually implemented today versus what the blueprint originally specified, and note any gap there too) still work correctly layered on top of the new pagination — picking a date range should reset to page 1 of the results within that range, not silently keep an old page number that may no longer have data.

This Stage is more involved than the others. Do not rush it. If you find the date-range filter component itself has its own missing presets or bugs while doing this, note them clearly in your Stage report — do not silently fix things outside this Stage's explicit scope, and do not silently ignore them either.

Verification:
1. With at least a few dozen test orders in the database spanning different dates, load the Orders page fresh (hard refresh, not from cache) and confirm it does NOT show every order — confirm it shows only the default window's orders.
2. Confirm pagination controls work and let you reach older orders.
3. Confirm selecting a date range filter still narrows results correctly and resets to the first page of that filtered set.
4. Open browser dev tools, check the actual network request sent to `/api/orders` on page load, and confirm it includes the new limit/pagination parameters rather than fetching unbounded.

Commit message: `[FIX] Stage 7 — Add pagination and sensible default date range to Orders page, removing unbounded fetch`

**STOP HERE. Do not continue to Stage 8 until told to proceed.**

---

## Stage 8 — Final combined verification of Half 1 and Stage 7

Using the client's exact real sample order:
```
Name: Adrian kozakiewicz
Contact: 4169967757
ADDRESS: 113 surbray grive mississauga 
Products: 1x Double Size 12" Thick Anna plus mattress 
Total : 250$
```

Walk through this completely in the real running app, in order:
1. Open Create Order, switch to Smart Paste, paste the text, click Parse.
2. Confirm all five fields pre-fill correctly with zero unrecognized-field prompts.
3. Confirm the Status dropdown defaults to "Undecided".
4. Confirm Status and Delivery Date appear exactly once in the form.
5. Click Create Order, confirm it saves and appears in the orders table.
6. Open the order, click Copy, confirm the clipboard text matches the original format and excludes Created By.
7. As Admin, change this order's status from "Undecided" to "Confirmed", confirm it works.
8. Separately, log in fresh (new session) and confirm the Orders page loads showing only the default recent window, not every order in the system, and that pagination works to reach older ones.
9. Open the regular manual Create Order modal (not paste) and confirm it also shows Status/Delivery Date exactly once with no duplicates.

If every step works exactly as described, update `QA_REPORT.md` with a dated entry documenting this full walkthrough. If any step fails, do not mark this done — fix the specific failing Stage's issue, re-run that Stage's own verification, then redo this entire Stage 8 walkthrough from step 1 again.

Commit message: `[QA] Stage 8 — Verified Smart Paste, copy-as-text, Undecided status, duplicate field fixes, and Orders pagination end to end`

**STOP HERE. Half 1 is complete. Do not begin Half 2 until told to proceed.**

---

# HALF 2 — SEQUENTIAL WHOLE-APPLICATION LOGIC AUDIT

This half exists because the previous QA pass tested features in isolation and missed default-state and data-flow bugs like the two found above. This half corrects that by going through the application one real page at a time, in order, checking each page deeply before moving to the next — not skimming the whole app once.

## How to audit each page (apply this to every Stage below, identically)

For the page assigned to that Stage, do all of the following before reporting it done:

1. **Read the entire component file(s) for that page first**, including any modal, table, or sub-component it directly renders. Do not skim — read every `useState`, every `useEffect`, every default value, every API call.
2. **Trace every piece of state that has a default value.** For each one, ask: is this default value the one a real user should actually see the moment this page loads, before they've clicked anything? If the default is an empty string, an empty array, "all", or "everything", ask whether that's actually correct for this specific page, or whether it's accidentally identical to the Orders page bug found above (silently fetching/showing more than makes sense by default).
3. **Trace every API call this page makes.** For each one: does the corresponding backend route have any pagination, filtering, or limit logic, or does it return everything unconditionally? If it returns everything unconditionally, is that actually fine for this specific data (e.g. a short list of Statuses that will never have thousands of rows) or is it a real problem (e.g. anything tied to Orders, which grows daily forever)? State your reasoning explicitly, don't just flag everything as a problem or wave everything through.
4. **Check every form on the page for the duplicate-field class of bug** — any place a field might be hardcoded AND also rendered through a separate dynamic loop, the same root cause as the Orders modals fixed in Stage 1 and 2.
5. **Check every permission-gated UI element actually has a matching backend check**, not just a frontend hide — pick at least one element per page and verify this concretely (inspect the network request, or attempt the action with a lower-privileged token) rather than assuming the pattern established elsewhere in the app definitely applies here too.
6. **Apply the same "does this logic actually make sense" standard from the original QA document** — a feature can run with zero errors and still be wrong (bad calculations, missing confirmations on destructive actions, fields that accept nonsensical values, etc).
7. **Actually run the app and look at this exact page with your own eyes**, as each of the three roles (`SUPER_ADMIN`, `ADMIN`, `USER`) where the page's behavior is supposed to differ by role, confirming what you found by reading code is what actually renders and happens.

Record findings for each Stage in `QA_REPORT.md`, in the same evidence-based format as the original QA document (Status: PASS / FAIL / LOGIC ISSUE / COULD NOT TEST, what you did, what you expected, what actually happened, evidence). If you find something broken, fix it as part of that same Stage — do not just document it and move on, unless the fix is large enough that it would meaningfully expand the scope of that Stage, in which case stop, clearly describe what you found and why you're not fixing it in this Stage, and wait for further instruction rather than guessing whether to proceed.

---

## Stage 9 — Dashboard (`apps/web/src/pages/dashboard.tsx` and all its widget components)

Audit this page using the 7-point method above. Pay specific attention to: does any widget on this page have the same unbounded-fetch problem as Orders did? Does the "Since You Were Gone" / recent activity logic make sense by default, or could it also silently try to show unbounded historical data?

Commit message: `[AUDIT] Stage 9 — Dashboard page reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 10 — Orders detail and table components (`OrderDetailPage.tsx`, `OrdersTable.tsx`, `OrdersKanban.tsx`, `OrdersCalendar.tsx`)

Audit these using the 7-point method. This is a continuation of the Orders page work from Stage 7 — specifically check whether Kanban and Calendar views have their own separate, possibly also-unbounded data fetching that Stage 7's fix didn't touch, since they may not share the same fetch logic as the table view.

Commit message: `[AUDIT] Stage 10 — Orders detail/table/kanban/calendar components reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 11 — Settings: Fields and Statuses (`FieldsSettings.tsx`, `FieldModal.tsx`, `StatusesSettings.tsx`, `StatusModal.tsx`)

Audit using the 7-point method. Specifically check: does creating or editing a Field or Status have any logic gaps (e.g. can two fields be created with the same name, can a required field be deleted while orders still depend on it, does archiving a status correctly warn about affected orders as the original blueprint specifies)?

Commit message: `[AUDIT] Stage 11 — Fields and Statuses settings reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 12 — Settings: General, Appearance, Notifications, Module Toggles

Audit using the 7-point method. Specifically check: do settings changes actually take effect immediately elsewhere in the app, or do they require something unexpected (a refresh, a re-login) that isn't documented or expected anywhere?

Commit message: `[AUDIT] Stage 12 — General/Appearance/Notifications/Module Toggle settings reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 13 — IAM: Users, Groups, Permissions (`UsersPage.tsx`, `UserModal.tsx`, `GroupsPage.tsx`, `GroupModal.tsx`, `PermissionsPage.tsx`, `UserPermissionsModal.tsx`)

Audit using the 7-point method. `UsersPage.tsx` was already confirmed to have no pagination/limit on its fetch — check whether this is a real problem given how many users a real installation is likely to have (probably a much smaller number than Orders, so use your own judgment on whether this needs the same severity of fix as Stage 7, and explain your reasoning either way). Specifically also check: does removing a policy from a group actually update affected users' real permissions promptly, or only on their next login (this exact question was raised as unverified in an earlier audit of this project — resolve it definitively here).

Commit message: `[AUDIT] Stage 13 — Users/Groups/Permissions pages reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 14 — Payroll module (`PayrollDashboard.tsx`, `EmployeesPage.tsx`, `PayrollPeriodsPage.tsx`, `AdvancesPage.tsx`)

Audit using the 7-point method. Specifically re-verify the net salary calculation (gross minus deductions) by doing the math yourself on a real entry, since this was previously confirmed correct but should be re-checked after any other changes made elsewhere in this document.

Commit message: `[AUDIT] Stage 14 — Payroll module pages reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 15 — Facebook Accounts module (`FbAccountsPage.tsx`, `FbAccountDetail.tsx`)

Audit using the 7-point method. Specifically re-confirm no raw password field exists anywhere, and that the encrypted vault note genuinely requires explicit reveal-with-password-confirmation rather than being visible by default.

Commit message: `[AUDIT] Stage 15 — Facebook Accounts module reviewed and any found issues fixed`

**STOP HERE. Wait for instruction to proceed.**

---

## Stage 16 — Auth pages, Profile, Audit Log (`login.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ProfilePage.tsx`, `AuditLogPage.tsx`, `AnnouncementsPage.tsx`, `MyPermissions.tsx`)

Audit using the 7-point method. This is the last Stage — after this, do a final pass specifically asking whether anything found across Stages 9 through 16 interacts badly with anything fixed in Half 1 (e.g. does the new "Undecided" status display correctly everywhere statuses are shown across all these pages, not just Orders).

Commit message: `[AUDIT] Stage 16 — Auth/Profile/Audit Log/Announcements pages reviewed and any found issues fixed, final cross-check complete`

**STOP HERE. This is the final Stage. Wait for confirmation that the whole document is complete.**

---

## RULES THAT APPLY TO THE ENTIRE DOCUMENT, BOTH HALVES

- One Stage at a time. Full stop after each one. Never assume permission to continue — wait for the explicit word "proceed" (or equivalent clear instruction) before starting the next Stage.
- Every Stage gets its own commit, with the exact message format given.
- Every Stage's verification must be performed in the real running app, not assumed from reading code alone.
- If a Stage's audit finds something genuinely outside this document's anticipated scope (a bug too large to fix within that Stage without significantly expanding it), stop, describe it clearly, and wait for instruction — do not silently expand scope, and do not silently ignore it either.
- Update `HANDOVER.md` after every single Stage, without exception, even though Stages are frequent — this is what makes the stop-and-wait rule actually safe across potential session interruptions.
- Never mark a Stage's verification as passed unless you personally watched it work, with real data, in the real running app.
