# NexaCRM — Round 2 Task Mandate

## READ THIS ENTIRE DOCUMENT BEFORE TOUCHING ANY FILE

This document contains 9 sequential tasks. You complete **exactly one task**, then **stop completely** and wait for the instruction "proceed" before doing anything else. Do not read ahead and start the next task. Do not batch tasks together. Do not assume permission to continue.

This rule is non-negotiable.

**At the end of every task, before stopping, you must:**
1. List every file you changed or deleted.
2. State exactly what you tested — not what you think should work, but what you actually ran or verified.
3. Commit with the exact commit message written in the task, word for word.
4. Push to GitHub.
5. Stop. Do not start the next task.

**If at any point during any task you encounter an error that requires touching files outside that task's scope, stop immediately. Do not fix it silently. Report exactly what you found, which files are affected, and wait for instruction. Never make changes outside the current task's defined scope.**

For every task, before writing a single line of code: read every file that is relevant to that task in full. Do not guess at file names or structure. Search first, read first, then change.

---

## TASK 1 — Fix order status change wiping order data

When an admin changes the status of a selected order, the order's data gets wiped. This is a critical bug.

1. Read the orders controller, orders service, and the frontend order modal/status change component in full.
2. Find the status update endpoint (`PATCH /api/orders/:id/status` or equivalent). Read exactly what it does — confirm it only updates the status field and nothing else. If it is overwriting other fields, fix it so it only touches the status column.
3. In the frontend, find the status change handler. Confirm it sends only the new status value, not the entire order object. If it is sending a full order object with missing fields (which would overwrite existing data with nulls/empty), fix it to send only `{ status: newStatusId }` or equivalent.
4. After fixing, verify: create a test order with full data, change its status, confirm all other fields remain intact.
5. `npx tsc --noEmit` in both apps — zero errors.
6. Commit: `[FIX] Task 1 — Fix order status change wiping order data`
7. Push. Stop.

---

## TASK 2 — Move status change to per-row dropdown, restrict to Admin/Super Admin only

Remove the global "Move to Status" bulk action that appears when orders are selected via checkbox. Replace it with a per-row inline status dropdown that appears directly beside the status value in the status column of the table. Users must never be able to change order status anywhere in the application.

1. Read the orders table component, the bulk actions component, and the status column render logic in full.
2. Remove the "Move to Status" option from the bulk actions bar entirely. If the bulk actions bar becomes empty after removal, hide it completely when orders are selected (or remove it — but check Task 5 first, as Task 5 adds a new global action to replace it).
3. In the status column of the orders table, add a small dropdown button directly beside the status badge. This dropdown lists all available statuses. Selecting one immediately updates that order's status. This button is only rendered if the current user's role is `ADMIN` or `SUPER_ADMIN`. For `USER` role, the status column shows the status badge only, with no dropdown.
4. Ensure the USER role cannot change order status through any other path either — check the authorize middleware on the status update route and confirm it requires ADMIN or SUPER_ADMIN role.
5. `npx tsc --noEmit` in both apps — zero errors.
6. Commit: `[FIX] Task 2 — Per-row status dropdown for Admin/SuperAdmin, remove bulk status change, block User from status edits`
7. Push. Stop.

---

## TASK 3 — Copy Details button must include notes

The "Copy Details" button on the order detail page copies order information but omits notes. Notes must be included regardless of whether they were added during creation or added later via edit.

1. Read the order detail page and the copy details function in full.
2. Find the function that builds the text string for the "Copy Details" button (the one that copies full details, not just the original paste).
3. Find where notes are stored on the order object — check the Prisma schema and the order service to confirm the field name (`notes`, `note`, or similar).
4. Add the notes field to the copy string. Format it as a clearly labelled line, e.g. `Notes: [note content]`. If notes is null or empty, omit the line entirely — do not print `Notes: ` with nothing after it.
5. Test: create an order with a note, open its detail page, click Copy Details, paste into a text editor and confirm the note appears.
6. `npx tsc --noEmit` — zero errors.
7. Commit: `[FIX] Task 3 — Include notes in Copy Details output`
8. Push. Stop.

---

## TASK 4 — Resizable rows and columns in orders table

Add the ability to resize column widths by dragging column borders, and resize row height with a control, similar to Excel/Google Sheets behavior.

1. Read the orders table component in full before doing anything.
2. For column resizing: implement drag-to-resize on column headers. Each column header border should be draggable horizontally. Store column widths in `localStorage` keyed by column name so they persist across page reloads for that user's browser.
3. For row height: add a small row height control — a segmented button or slider with 3 options: Compact, Default, Comfortable. This changes the `padding` / `height` of all rows simultaneously. Store the selected row height in `localStorage` so it persists.
4. The resize handle on column headers must be visually obvious on hover (cursor changes to `col-resize`, a visible drag handle appears).
5. Do not use any new npm packages for this — implement with pure React state and mouse event handlers.
6. `npx tsc --noEmit` — zero errors.
7. Commit: `[FEATURE] Task 4 — Resizable columns and row height control in orders table`
8. Push. Stop.

---

## TASK 5 — Global hide/show fields control in orders table

Replace the checkbox-selected bulk action area with a permanent "Hide Fields" button that is always visible above the orders table, regardless of whether any rows are selected. This button opens a dropdown with checkboxes for every column. Checking a column hides it. Unchecking shows it. A "Confirm" button applies the selection.

1. Read the orders table component and the bulk actions component in full.
2. The "Hide Fields" control must be always visible — it does not require any rows to be selected to appear.
3. The control must show a checkbox list of all available columns/fields. By default all fields are shown (all boxes unchecked = all visible). Checking a box marks that field for hiding. Clicking Confirm hides the checked fields.
4. Hidden field preferences must persist in `localStorage` so they survive page reload.
5. A "Reset" option must be available to restore all fields to visible.
6. This control is visible to all roles.
7. If Task 2 removed the bulk actions bar entirely, place the Hide Fields button in the toolbar area above the table where filters and search are. If the bulk actions bar still exists for other actions, place Hide Fields there as a permanent fixture.
8. `npx tsc --noEmit` — zero errors.
9. Commit: `[FEATURE] Task 5 — Global always-visible Hide Fields control for orders table`
10. Push. Stop.

---

## TASK 6 — Fix User dashboard showing "Unknown" for customer name, product, delivery date

When a User role adds an order, their dashboard shows "Unknown" instead of the actual customer name, product, and delivery date.

1. Read the dashboard service backend — specifically the user dashboard query (`/api/dashboard/user` or equivalent). Read what fields it selects from the orders table.
2. Read the user dashboard frontend component and find where it renders the order list or recent orders widget.
3. The query likely does not include `customerName`, `product`, or `deliveryDate` (or whatever the actual field names are in the schema) in its select clause. Add those fields to the query.
4. In the frontend, confirm the component is reading and rendering those fields correctly. If it is reading a different field name than what the backend returns, fix the mismatch.
5. Test: log in as a User, create an order, go to the dashboard, confirm the order shows the correct customer name, product, and delivery date.
6. `npx tsc --noEmit` — zero errors.
7. Commit: `[FIX] Task 6 — Fix User dashboard showing Unknown for customer name, product, delivery date`
8. Push. Stop.

---

## TASK 7 — Hide Payroll and FB Accounts from User role

The User role should not see or access the Payroll or FB Accounts modules anywhere in the application.

1. Read `apps/web/src/components/layout/Sidebar.tsx` in full.
2. The Payroll and FB Accounts nav items must only render if the current user's role is `ADMIN` or `SUPER_ADMIN`. Wrap them in a role check: `{isAdmin && <NavItem ... />}`. The `isAdmin` variable already exists in the sidebar — use it.
3. In the backend, read the payroll routes and FB accounts routes. Confirm the `authorize` middleware on those routes requires at minimum ADMIN role. If any route allows USER role access, add the role restriction now.
4. Also check that if a User navigates directly to `/payroll` or `/fb-accounts` via URL, they are redirected. Add a role check to the route definitions in `App.tsx` — wrap those routes in an admin-only protected route component.
5. `npx tsc --noEmit` — zero errors.
6. Commit: `[FIX] Task 7 — Restrict Payroll and FB Accounts to Admin and Super Admin only`
7. Push. Stop.

---

## TASK 8 — Restore Final Paid Price field to orders

The Final Paid Price field was accidentally removed from the application. It must be restored exactly once — no duplicates, no "Final Paid Price Notes" field alongside it.

1. Check the Prisma schema first. Confirm whether `finalPaidAmount` (or equivalent) still exists on the Order model. If it was removed from the schema, add it back: `finalPaidAmount Decimal? @db.Decimal(10,2)`. Generate migration SQL with `--create-only` and provide it for manual Supabase execution. Run `npx prisma generate`.
2. In the orders service, confirm `finalPaidAmount` is included in create, update, and read queries. Add it if missing.
3. In the order creation/edit modal frontend, add a single "Final Paid Price" input field. It must appear exactly once. Do not add any notes field alongside it.
4. In the orders table view, add a "Final Paid Price" column. The value in this column must be displayed in bright red (`text-red-500` or equivalent) so it stands out immediately. If the value is null/empty, show nothing (not "null", not "0", nothing).
5. In the order detail page, show Final Paid Price in bright red as well.
6. `npx tsc --noEmit` — zero errors.
7. Commit: `[FIX] Task 8 — Restore Final Paid Price field, display in red in table and detail view`
8. Push. Stop.

---

## TASK 9 — Fix orders table default filter and radio button date controls

By default the orders table must show only two sets of orders: orders created today, and orders whose delivery date is today. Two radio buttons control which set is shown. The existing date range filter must remain untouched and fully functional.

1. Read the orders table component and the orders fetch/filter logic in full — both frontend and backend.
2. Add two radio buttons at the top of the orders table, above the existing date filter:
   - **"Created Today"** — shows orders where `createdAt` date equals today's date
   - **"Delivery Today"** — shows orders where `deliveryDate` equals today's date
3. "Created Today" must be selected by default when the page first loads. This means on first load, the table only shows today's created orders.
4. When either radio button is selected, the existing date range filter must be cleared/ignored — the radio button overrides it. When the user uses the existing date range filter (picks custom dates), the radio button selection must be cleared — the date filter overrides it. Only one filter mode can be active at a time.
5. The existing date range filter functionality must remain exactly as it is — do not touch its logic, only ensure it properly deactivates the radio selection when used.
6. Check the backend orders endpoint to confirm it supports filtering by `createdAt` date and by `deliveryDate`. If either filter parameter is missing from the backend, add it now.
7. `npx tsc --noEmit` in both apps — zero errors.
8. Commit: `[FEATURE] Task 9 — Default orders filter to today, add Created Today / Delivery Today radio buttons`
9. Push. Stop.

---

## RULES SUMMARY

1. One task at a time. Stop completely after each one.
2. Do not start a task until told "proceed".
3. Read all relevant files before changing anything.
4. Commit after every task with the exact message given.
5. Push to GitHub after every task.
6. If something outside the current task's scope is broken, note it in your report and leave it alone.
7. If you cannot complete a step, stop, report exactly what you found, and wait for instruction. Do not guess.
8. Never remove a feature unless explicitly told to.
9. Never modify the Prisma schema without immediately generating migration SQL and providing it for manual Supabase execution.
10. `npx tsc --noEmit` must pass with zero errors after every single task before committing.
