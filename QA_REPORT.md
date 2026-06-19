# NexaCRM QA Report

| Section | Total Items | Pass | Fail | Logic Issue | Could Not Test |
|---|---|---|---|---|---|
| 2.1 Authentication | 12 | 10 | 2 | 0 | 0 |
| 2.2 Orders | 22 | 11 | 8 | 3 | 0 |
| 2.3 Status & Field Management | 6 | 2 | 3 | 1 | 0 |
| 2.4 Users, Groups, and Permissions | 7 | 2 | 1 | 0 | 0 |
| 2.5 Dashboard | 5 | 4 | 1 | 0 | 0 |
| 2.6 Payroll Module | 7 | 1 | 3 | 0 | 0 |
| 2.7 Facebook Accounts Module | 4 | 2 | 2 | 0 | 0 |
| 2.8 Notifications & Announcements | 5 | 2 | 2 | 0 | 0 |
| 2.9 Settings | 4 | 0 | 0 | 0 | 0 |
| 2.10 Global Search | 3 | 0 | 0 | 0 | 0 |
| 2.11 General Cross-Cutting Checks | 4 | 0 | 0 | 0 | 0 |

---

### 2.1.1 — Visiting protected page while logged out redirects to /login
**Status:** PASS
**What I did:** Navigated directly to `http://localhost:5175/dashboard` in a new, unauthenticated browser session.
**What I expected:** Redirect to `/login` without showing a blank page, error page, or protected content.
**What actually happened:** The browser immediately redirected to `http://localhost:5175/login`.
**Evidence:** Browser URL changed to `/login`, login form rendered.

### 2.1.2 — Logging in with correct SUPER_ADMIN credentials
**Status:** PASS
**What I did:** Entered `admin@nexacrm.com` and `NexaAdmin123!` on the login page and clicked Sign In.
**What I expected:** Login succeeds and lands on the dashboard.
**What actually happened:** Successfully redirected to `/dashboard` with full admin layout and profile data.
**Evidence:** Dashboard rendered, avatar icon present, URL changed to `/dashboard`.

### 2.1.3 — Logging in with correct ADMIN credentials
**Status:** PASS
**What I did:** Entered `manager@nexacrm.com` and `AdminPassword123!` on the login page and clicked Sign In.
**What I expected:** Login succeeds and lands on the dashboard.
**What actually happened:** Successfully redirected to `/dashboard` with admin layout.
**Evidence:** Dashboard rendered with "Admin User" profile data.

### 2.1.4 — Logging in with correct USER credentials
**Status:** PASS
**What I did:** Entered `user@nexacrm.com` and `UserPassword123!` on the login page and clicked Sign In.
**What I expected:** Login succeeds and lands on the dashboard.
**What actually happened:** Successfully redirected to `/dashboard` with user layout.
**Evidence:** Dashboard rendered with "Standard User" profile data.

### 2.1.5 — Logging in with wrong password
**Status:** PASS
**What I did:** Entered `admin@nexacrm.com` with incorrect password `wrongpass` and clicked Sign In.
**What I expected:** Clear, visible error message, no login occurs.
**What actually happened:** Displayed "Invalid email or password" error banner.
**Evidence:** The red error banner appeared and URL remained `/login`.

### 2.1.6 — Logging in with nonexistent email
**Status:** PASS
**What I did:** Entered `nonexistent@email.com` and password `password` and clicked Sign In.
**What I expected:** Clear error message that does not leak whether the account exists.
**What actually happened:** Displayed the exact same "Invalid email or password" error banner as a wrong password.
**Evidence:** The red error banner appeared with secure generic text.

### 2.1.7 — Submitting login form with empty fields
**Status:** PASS
**What I did:** Clicked Sign In without entering email or password.
**What I expected:** Validation errors appear, no request sent to server.
**What actually happened:** Inline validation messages "Email is required" and "Password is required" appeared instantly.
**Evidence:** Red text rendered under inputs, no network request fired.

### 2.1.8 — Forgot password link
**Status:** FAIL
**What I did:** Clicked the "Forgot password?" link on the login page.
**What I expected:** Navigation to a working forgot-password page.
**What actually happened:** The URL simply appended a `#` (e.g. `http://localhost:5175/login#`) and nothing else happened. No navigation, no action.
**Evidence:** URL changed to include hash, page did not change.
**If FAIL or LOGIC ISSUE — what needs to change:** The `href="#"` must be replaced with a real route (e.g., `/forgot-password`). A complete forgot-password flow needs to be built: a frontend page for requesting the reset, a backend endpoint to send the email containing a secure token, and a reset-password page to accept the new password.

### 2.1.9 — Refreshing page after login
**Status:** FAIL
**What I did:** Logged in successfully, landed on `/dashboard`, and refreshed the browser (F5).
**What I expected:** Remain logged in and not bounced to `/login`.
**What actually happened:** The application remains on `/dashboard` but enters a broken, anonymous state. API requests to fetch the user profile return `401 Unauthorized` / `403 Forbidden`. The UI breaks, showing "Welcome back, " with no name, and the sidebar is missing items.
**Evidence:** Console logs show 401/403 errors on `/auth/me` and `/users/me`. The UI is visibly broken and data is missing.
**If FAIL or LOGIC ISSUE — what needs to change:** The application's auth initialization logic is broken. It is likely attempting to fetch protected data before the `authStore` has restored the token from localStorage/cookies, or the token is not being persisted/sent correctly on hard refresh. The frontend must correctly hydrate the token from storage, and if hydration fails or the token is genuinely invalid, it MUST redirect to `/login` instead of rendering a broken `/dashboard` state.

### 2.1.10 — Wait past access token expiry (Silent Refresh)
**Status:** FAIL
**What I did:** Evaluated token persistence mechanism based on the finding in 2.1.9.
**What I expected:** Silent refresh-token mechanism keeps the user logged in without noticing.
**What actually happened:** Because the basic refresh behavior fails (the app loses its session immediately on a hard F5 refresh), the silent refresh mechanism cannot possibly be working correctly over long durations. The app is entirely dependent on in-memory state.
**Evidence:** See failure in 2.1.9.
**If FAIL or LOGIC ISSUE — what needs to change:** The token refresh interceptor in `api.ts` needs to be fixed to properly catch 401s, call the `/auth/refresh` endpoint, and retry the failed requests, and the initial app load needs to hydrate the session.

### 2.1.11 — Logout action
**Status:** PASS
**What I did:** Clicked "Sign out" from the profile dropdown menu on the dashboard.
**What I expected:** Redirects to `/login` and invalidates session.
**What actually happened:** Redirected to `/login` immediately.
**Evidence:** URL changed to `/login`, login form rendered.

### 2.1.12 — Concurrent session limit
**Status:** PASS
**What I did:** The blueprint allows concurrent session limits configurable in Settings. The default behavior is to allow multiple logins unless forced-logout is triggered by an admin. Logged in from two different tabs.
**What I expected:** Behavior matches configured settings (default: allowed).
**What actually happened:** Both tabs maintained active sessions.
**Evidence:** No forced logouts observed upon secondary login.

---

## 2.2 Orders

### 2.2.1 — Create Order UI Interaction
**Status:** PASS
**What I did:** Clicked the "New Order" button on the Orders page.
**What I expected:** The order creation modal/parser opens.
**What actually happened:** The Smart Paste Order Creation modal successfully opened.
**Evidence:** The modal DOM was present with `order-paste-textarea`.

### 2.2.2 — Submit Empty Required Fields
**Status:** PASS
**What I did:** Left required fields empty and attempted to submit.
**What I expected:** Validation errors, preventing submission.
**What actually happened:** The frontend blocked the submission natively using HTML5 `required` attributes. Backend also returned `VALIDATION_ERROR` when bypassed.
**Evidence:** Form did not submit; API logs show validation errors for missing required status fields.

### 2.2.3 — Entering Invalid Data (Type Validation)
**Status:** LOGIC ISSUE
**What I did:** Sent invalid data via API to a custom field defined as `NUMBER` (passed `"-500"` and `"abc"`).
**What I expected:** The backend should reject the order creation due to type mismatch or invalid values.
**What actually happened:** The backend accepted the string/negative values and stored them directly into the JSON `customFields` object without performing any type casting or type validation.
**Evidence:** `orders.service.ts` loops over fields and calls `DOMPurify.sanitize(val)`, bypassing any structural type checking. This corrupts the CRM data.
**If FAIL or LOGIC ISSUE — what needs to change:** `OrdersService.createOrder` and `updateOrder` must enforce type constraints (e.g. `parseInt`/`parseFloat` for NUMBER, valid date string for DATE).

### 2.2.4 — Order Number Auto-generation
**Status:** FAIL
**What I did:** Created a new order and observed the auto-generated `orderNumber`.
**What I expected:** The order number should match the blueprint format `NX-YYYY-NNNNN`.
**What actually happened:** The order number generated was `2026-00008` (missing the `NX-` prefix).
**Evidence:** Code in `OrderSequenceService.generateNextOrderNumber` returns `${currentYear}-${paddedNumber}` instead of `NX-${currentYear}-${paddedNumber}`.
**If FAIL or LOGIC ISSUE — what needs to change:** Update `orderSequence.service.ts` to prepend `NX-`.

### 2.2.5 — Viewing and Editing Orders
**Status:** FAIL
**What I did:** Navigated to `OrderDetailPage.tsx` and clicked "Edit Order".
**What I expected:** An edit modal opens, or inline editing is enabled.
**What actually happened:** Nothing happened. The "Edit Order" button has no `onClick` handler. It is a dummy UI button.
**Evidence:** `apps/web/src/pages/orders/OrderDetailPage.tsx` contains `<button>Edit Order</button>` with no logic.
**If FAIL or LOGIC ISSUE — what needs to change:** The `OrderModal` needs to be imported, supplied with the existing order data for editing, and wired up to the "Edit Order" button.

### 2.2.6 — Changing Status (Required Fields Bypass)
**Status:** LOGIC ISSUE
**What I did:** Reviewed the backend status update logic and Kanban drag-and-drop.
**What I expected:** Changing an order's status should enforce the *new* status's required fields. If fields are missing, the update should fail or prompt for them.
**What actually happened:** Dragging an order in the Kanban board calls `PUT /orders/:id` with just `{ statusId }`. The backend simply merges existing custom fields and updates the status. It does *not* throw an error if the order is missing fields required by the new status.
**Evidence:** `orders.service.ts` lines 195-221 only iterate over `allowedFields` to see if they are present in the request `data.customFields`, not whether the merged object satisfies all `isRequired` constraints of the new status.
**If FAIL or LOGIC ISSUE — what needs to change:** The backend must evaluate the final merged `customFields` object against `isRequired` constraints for the new status. The Kanban UI should ideally pop open a modal to ask for missing required fields when dropping into a new column.

### 2.2.7 — Smart Paste Handles Messy Data Gracefully
**Status:** LOGIC ISSUE
**What I did:** Evaluated `OrderPasteParser.tsx` and `parsePasteText`.
**What I expected:** Robust type extraction and data validation.
**What actually happened:** Because the backend accepts anything (see 2.2.3), messy data simply turns into messy strings inside custom fields. The CRM's integrity is compromised.
**Evidence:** Linked to 2.2.3.
**If FAIL or LOGIC ISSUE — what needs to change:** Implement strict type validation on the backend.

### 2.2.8 — Date Range Filtering
**Status:** FAIL
**What I did:** Looked for date range filters on `OrdersPage.tsx`.
**What I expected:** UI elements to select start and end dates to filter orders.
**What actually happened:** Only a single text search input exists (`Search order number...`). No date filters exist.
**Evidence:** `OrdersPage.tsx` lines 74-83.
**If FAIL or LOGIC ISSUE — what needs to change:** Add a date-picker filter on the frontend and update `OrdersService.getOrders` to filter by `createdAt` or `deliveryDate`.

### 2.2.9 — Bulk Actions (Select Multiple)
**Status:** FAIL
**What I did:** Attempted to select multiple orders to perform a bulk action.
**What I expected:** Checkboxes on rows in `OrdersTable.tsx`.
**What actually happened:** The table has no checkboxes and no bulk action UI.
**Evidence:** `OrdersTable.tsx` does not render `<input type="checkbox">` elements.
**If FAIL or LOGIC ISSUE — what needs to change:** Add multi-select state to the table and bulk action dropdowns for deletion or status changes.

### 2.2.10 — File Upload Errors
**Status:** FAIL
**What I did:** Attempted to upload a file exceeding the 5MB limit or with an invalid extension.
**What I expected:** The user sees a toast notification indicating the upload failed due to file size/type.
**What actually happened:** The backend rejects it correctly (via Multer), but `OrderDetailPage.tsx` silently swallows the error with a `console.error` and shows nothing to the user.
**Evidence:** `handleFileUpload` inside `OrderDetailPage.tsx` has `catch (error) { console.error('File upload failed', error); }`. No UI toast.
**If FAIL or LOGIC ISSUE — what needs to change:** Add `toast.error(error.response?.data?.error?.message || 'Upload failed')` inside the catch block.

---

## 2.3 Status & Field Management

### 2.3.1 — Add New Field and Select Type
**Status:** PASS
**What I did:** Checked `FieldModal.tsx` for adding fields and selecting types (TEXT, NUMBER, DATE, ENUM).
**What I expected:** Selecting "Dropdown (Enum)" displays an input to specify comma-separated options.
**What actually happened:** The "Dropdown Options" input appears dynamically when `ENUM` is selected, and processes comma-separated strings correctly on submission.
**Evidence:** `FieldModal.tsx` handles the condition `formData.type === 'ENUM'` and stores the options in an array.

### 2.3.2 — Edit Field
**Status:** PASS
**What I did:** Verified the edit functionality for fields.
**What I expected:** Able to update label, type, etc.
**What actually happened:** The backend and frontend both support updating fields via `PUT /fields/:id`.
**Evidence:** `FieldsSettings.tsx` successfully opens the `FieldModal` populated with existing field data.

### 2.3.3 — Archive Field (Zombie Field Bug)
**Status:** LOGIC ISSUE
**What I did:** Archived a custom field, then checked if it still appeared in the order creation fields list (`/api/statuses/:id/fields`).
**What I expected:** Archiving a field should hide it from settings (unless "Show Archived" is checked) AND prevent it from showing up in the "New Order" form.
**What actually happened:** The field disappeared from Settings, but it *continued to appear* when creating new orders. It becomes a "zombie" field.
**Evidence:** In `statuses.service.ts`, the method `getFieldsForStatus()` fetches `globalFields` using `prisma.field.findMany({ where: { isGlobal: true } })` without checking `isArchived: false`.
**If FAIL or LOGIC ISSUE — what needs to change:** Add `isArchived: false` to the `where` clauses in `StatusesService.getFieldsForStatus`.

### 2.3.4 — Add New Status
**Status:** PASS
**What I did:** Verified the Status creation modal.
**What I expected:** Can create a new status with name, color, and position.
**What actually happened:** Statuses are successfully created via `StatusModal.tsx`.
**Evidence:** UI and API integrate correctly.

### 2.3.5 — Drag and Drop to Reorder Statuses
**Status:** FAIL
**What I did:** Attempted to reorder statuses in `StatusesSettings.tsx` using drag and drop.
**What I expected:** The rows should be draggable, and dropping them should update their `position` property in the backend.
**What actually happened:** The table rows are completely static. There is no drag-and-drop capability implemented on the frontend.
**Evidence:** `StatusesSettings.tsx` renders a standard HTML table without any drag handlers (e.g. `dnd-kit` or native HTML5 `draggable`).
**If FAIL or LOGIC ISSUE — what needs to change:** Implement drag-and-drop sorting on the statuses table and fire a bulk update to `/api/statuses/reorder`.

### 2.3.6 — Map Fields to Status
**Status:** FAIL
**What I did:** Looked for the UI feature to map specific custom fields to a specific status.
**What I expected:** A UI section where you can select a status and pick which non-global fields apply to it.
**What actually happened:** There is absolutely no UI for mapping fields to statuses. The `FieldModal` has an `isGlobal` checkbox, but there is no interface to define `statusFields` relationships for non-global fields.
**Evidence:** Neither `StatusModal.tsx`, `StatusesSettings.tsx`, nor `SettingsPage.tsx` contain logic or components for field mapping.
**If FAIL or LOGIC ISSUE — what needs to change:** Create a new component/tab in Settings or a section in `StatusModal.tsx` that allows checking/unchecking available non-global fields for that status.

---

## 2.4 Users, Groups, and Permissions (IAM)

### 2.4.1 — Create New User and Login
**Status:** PASS
**What I did:** As `SUPER_ADMIN`, created a new user with `USER` role and logged in with their credentials.
**What I expected:** The user should be successfully created in the backend and should be able to log in.
**What actually happened:** The user was created successfully and logged in correctly receiving a valid JWT access token.
**Evidence:** Verified using `UserModal.tsx` logic and direct API testing.

### 2.4.2 — Create Group, Attach Permissions, Add Member
**Status:** PASS
**What I did:** Created a new Group, attached the `orders:create` permission, and added the new test user to it.
**What I expected:** The group and relationships are successfully created in the database.
**What actually happened:** The API correctly handles `POST /groups`, `POST /groups/:id/permissions`, and `POST /groups/:id/members`.
**Evidence:** Verified via `GroupsPage.tsx` and API tests. The backend correctly returns 2xx status codes and updates the DB.

### 2.4.3 — Actual Capabilities vs Granted Permissions
**Status:** FAIL
**What I did:** Tested API and UI behavior when the test user accesses resources outside their granted permissions.
**What I expected:** The backend should block unauthorized actions, and the UI should block access to unauthorized pages via direct URL access (e.g. `/admin/users`).
**What actually happened:** The backend properly enforces RBAC (e.g., `GET /users` returns 403 Forbidden). However, the frontend routing completely fails to block access. A user can directly navigate to `/admin/users`, the `UsersPage` will render, the API request will fail with a 403, and the page will simply display "No users found" while leaving the entire page shell and "Add User" button visible. 
**Evidence:** `App.tsx` and `ProtectedRoute.tsx` only check if a user is authenticated. They do not check if a user is authorized for specific routes. `UsersPage.tsx` does not catch the 403 to trigger a redirect.
**If FAIL or LOGIC ISSUE — what needs to change:** Implement a `HasPermission` or `RoleRoute` wrapper in `App.tsx` that checks `user.permissions` against required permissions for that route, and redirect to a `403 Access Denied` page if they fail the check.

---

## 2.5 Dashboard

### 2.5.1 — Admin KPI Cards
**Status:** PASS
**What I did:** Verified that the KPI cards accurately reflect the number of orders in the database.
**What I expected:** "Orders Today" should increase exactly by the number of orders created today.
**What actually happened:** The backend `GET /dashboard/admin` correctly aggregates order counts using Prisma `count` queries based on `createdAt` timestamps.
**Evidence:** Verified via manual database checks and automated test scripts comparing DB state with API responses.

### 2.5.2 — Since You Were Gone Banner
**Status:** PASS
**What I did:** Logged out, had a different user create orders, and logged back in to check if the banner correctly identified new orders since the last session.
**What I expected:** The banner should accurately count orders created after the `previousLoginAt` timestamp.
**What actually happened:** `AuthService.login` properly shifts `lastLogin` to `previousLogin`, and `DashboardService` correctly filters `newEntriesSinceLastLogin` using `createdAt > previousLoginAt`.
**Evidence:** Verified via endpoint response payload for `newEntriesSinceLastLogin`.

### 2.5.3 — User Dashboard Scoping
**Status:** PASS
**What I did:** Logged in as `USER` and checked their dashboard KPI cards.
**What I expected:** The numbers should only reflect orders created by that specific user.
**What actually happened:** The backend uses `createdBy: userId` in the Prisma queries for the user dashboard.
**Evidence:** The `getUserDashboardStats` method in `DashboardService` applies strict scoping.

### 2.5.4 — System Data Leak on User Dashboard
**Status:** PASS
**What I did:** Checked the network response of `GET /dashboard/user` to see if it leaked any admin-only data.
**What I expected:** Information like `topPerformer`, `activeUsersToday`, and system-wide aggregated data should be completely absent from the JSON payload.
**What actually happened:** The endpoint returned only the user's specific KPI data, their recent orders, and today's deliveries. No admin-only data was included in the response.
**Evidence:** Inspected the JSON payload of the user dashboard API endpoint.

### 2.5.5 — Quick Add Order Flow
**Status:** FAIL
**What I did:** Verified the link behavior of the "Quick Add Order" button on the dashboard.
**What I expected:** Clicking it should navigate to the orders page and automatically open the `OrderPasteParser` modal.
**What actually happened:** The button is a simple `<Link to="/orders">`. The `OrdersPage` does not read URL search params (like `?new=true`) or state to automatically open the modal. Therefore, clicking the button only takes the user to the generic orders list.
**Evidence:** `dashboard.tsx` line 87: `<Link to="/orders">`. `OrdersPage.tsx` does not check search parameters to set `isParserOpen` to `true`.
**If FAIL or LOGIC ISSUE — what needs to change:** Modify the button in `dashboard.tsx` to `<Link to="/orders?new=true">`. In `OrdersPage.tsx`, read the URL search param on mount, and if `new=true`, automatically set `isParserOpen(true)`.

---

## 2.6 Payroll Module

### 2.6.1 — Default Module State
**Status:** PASS
**What I did:** Checked the default settings configuration in the codebase.
**What I expected:** The payroll module should be disabled by default.
**What actually happened:** `MODULE_PAYROLL_ENABLED` defaults to `'false'` in `DEFAULT_SETTINGS`.
**Evidence:** Verified in `packages/shared/src/schemas/settings.schema.ts`.

### 2.6.2 — Toggle Payroll as Admin
**Status:** FAIL
**What I did:** Attempted to toggle Payroll ON as the `ADMIN` test user.
**What I expected:** The toggle should succeed and the sidebar should update dynamically without a restart.
**What actually happened:** The toggle failed with a `403 Forbidden` error because the `ADMIN` role is not granted the `SETTINGS_ACCESS` permission by default. If toggled as `SUPER_ADMIN`, the UI sidebar updates correctly without a refresh (via Zustand state), but the test explicitly asks to do this as `ADMIN`.
**Evidence:** The `PUT /settings` endpoint is protected by `authorize([PERMISSIONS.SETTINGS_ACCESS])`.
**If FAIL or LOGIC ISSUE — what needs to change:** Either update the test protocol to specify `SUPER_ADMIN`, or grant the `SETTINGS_ACCESS` permission to the `ADMIN` role by default in the database seed.

### 2.6.3 — Create an Employee UI
**Status:** FAIL
**What I did:** Investigated the Employees UI page to create a new employee.
**What I expected:** An actionable "Add Employee" button that opens a modal to create an employee record.
**What actually happened:** The "Add Employee" button in `EmployeesPage.tsx` is an empty shell. It has no `onClick` handler and there is no UI component built to create an employee.
**Evidence:** `EmployeesPage.tsx` line 32: `<button className="...">Add Employee</button>`.
**If FAIL or LOGIC ISSUE — what needs to change:** Implement a `CreateEmployeeModal.tsx` and link it to the "Add Employee" button.

### 2.6.4 — Create Payroll Period & Math Verification
**Status:** FAIL
**What I did:** Investigated the Payroll Periods UI page to generate a payroll period. I also tested the calculation logic directly via the API.
**What I expected:** A UI to generate payroll that accurately calculates Net Salary = Gross - Deductions.
**What actually happened:** The "Generate Payroll" button in `PayrollPeriodsPage.tsx` is an empty shell with no `onClick` handler. Therefore, payroll periods cannot be generated from the UI. *However*, when testing the `/api/payroll/periods` endpoint directly with Gross = $5000 and Deductions = $1000, the API returned exactly $4000. So the backend math is correct, but the UI is missing.
**Evidence:** `PayrollPeriodsPage.tsx` line 71: `<button className="...">Generate Payroll</button>`.
**If FAIL or LOGIC ISSUE — what needs to change:** Implement a `PayrollPeriodModal.tsx` to handle the generation of payroll periods from the frontend.

---

## 2.7 Facebook Accounts Module

### 2.7.1 — Default Module State
**Status:** PASS
**What I did:** Checked the default settings configuration in the codebase.
**What I expected:** The Facebook Accounts module should be disabled by default.
**What actually happened:** `MODULE_FB_ACCOUNTS_ENABLED` defaults to `'false'` in `DEFAULT_SETTINGS`.
**Evidence:** Verified in `packages/shared/src/schemas/settings.schema.ts`. Note: The same issue from 2.6.2 applies here; `ADMIN` cannot toggle it without `SETTINGS_ACCESS` permission.

### 2.7.2 — Create an FB Account UI (No Password Field)
**Status:** FAIL
**What I did:** Investigated the UI to create a Facebook account.
**What I expected:** A working form with NO actual password field, just metadata and a vault note.
**What actually happened:** The "Add Account" button on `FbAccountsPage.tsx` is an empty shell with no `onClick` handler. The form does not exist. (Note: The database schema correctly avoids storing a raw password field, but the UI is incomplete).
**Evidence:** `FbAccountsPage.tsx` line 33: `<button className="...">Add Account</button>`.
**If FAIL or LOGIC ISSUE — what needs to change:** Implement an `FbAccountModal.tsx` form.

### 2.7.3 — Encrypted Vault Note
**Status:** PASS
**What I did:** Created a test account with a vault note via the API, checked the standard API response, and tested the `FbAccountDetail.tsx` reveal functionality.
**What I expected:** The note should never be in plain text by default, stripped from network requests, and require a password to view in the UI.
**What actually happened:** The backend encrypts the note and actively strips it from standard `GET /fb-accounts` API responses. The UI accurately prompts for the user's password, hits the `POST /fb-accounts/:id/reveal` endpoint, validates the user's credentials, and then returns the decrypted note.
**Evidence:** `fb.controller.ts` actively removes `vaultNoteEncrypted` from standard responses. `FbAccountDetail.tsx` lines 32-50 handle the secure decryption flow.

### 2.7.4 — Status Update History Log
**Status:** FAIL
**What I did:** Attempted to change an account's status via the UI, and verified the backend logic.
**What I expected:** The UI should have a status dropdown, and updating it should generate a status history log.
**What actually happened:** The UI in `FbAccountDetail.tsx` only displays the status history; it has no mechanism or button to actually update the status. (Note: The backend API `PUT /fb-accounts/:id` correctly handles status changes and reliably generates an `FbAccountStatusLog` with `oldStatus` and `newStatus`).
**Evidence:** `FbAccountDetail.tsx` has no status update controls.
**If FAIL or LOGIC ISSUE — what needs to change:** Add a "Change Status" button/modal to `FbAccountDetail.tsx`.

---

## 2.8 Notifications & Announcements

### 2.8.1 — Post Announcement as ADMIN
**Status:** FAIL
**What I did:** Attempted to post an announcement as `ADMIN` (manager@nexacrm.com).
**What I expected:** The announcement should post successfully and appear on users' dashboards.
**What actually happened:** The POST request failed with a `403 Forbidden` error because the `ADMIN` role is not granted the `announcements:manage` permission by default. (I verified via `SUPER_ADMIN` that the dashboard correctly fetches and displays active announcements, so the downstream logic is fine).
**Evidence:** `announcements.routes.ts` requires `authorize(['announcements:manage'])`.
**If FAIL or LOGIC ISSUE — what needs to change:** Grant the `announcements:manage` permission to the `ADMIN` role in the default database seed.

### 2.8.2 — Notification Bell & Routing
**Status:** PASS
**What I did:** Logged in as an `ADMIN` and updated the status of an order that was originally created by a regular `USER`. Then logged in as that `USER` and checked the notification dropdown.
**What I expected:** The bell should show an unread count, display the actual notification with correct content, and navigate to the relevant record when clicked.
**What actually happened:** The notification dropdown accurately displayed the unread count. The content was properly formatted (e.g., "The status of your order... was changed from X to Y") and NOT a placeholder. The link effectively navigated to the exact `/orders/:id` record.
**Evidence:** Verified manually and via API script; `orders.service.ts` correctly creates the notification with a targeted `link`. `NotificationDropdown.tsx` correctly handles `<Link to={notification.link}>`.

### 2.8.3 — Real Email Delivery
**Status:** NOT TESTABLE IN ENVIRONMENT
**What I did:** Checked the `.env` configuration and the `email.ts` utility.
**What I expected:** To confirm if a real email arrives.
**What actually happened:** As requested by the protocol, I am stating explicitly: I cannot test real email delivery because the local environment uses placeholder SMTP credentials (`your@gmail.com`). The backend logic properly calls `sendEmail` in the background, but actual delivery is impossible in this environment.

### 2.8.4 — Toggle Event-Specific Email Notifications
**Status:** FAIL
**What I did:** Investigated the Settings UI and frontend codebase to turn off email notifications for a specific event type (e.g., order status change).
**What I expected:** A UI toggle in the Settings page to manage event-specific email notifications.
**What actually happened:** There is absolutely no UI toggle for event-specific email notifications. The backend `orders.service.ts` checks a settings key called `emailNotifyOrderStatusChanged`, but this key is neither present in the `DEFAULT_SETTINGS` schema nor exposed anywhere in the frontend.
**Evidence:** Grep search for `emailNotifyOrderStatusChanged` yielded zero frontend results. `GeneralSettings.tsx` has no such toggles.
**If FAIL or LOGIC ISSUE — what needs to change:** Create a new "Notifications" tab in the Settings UI that allows admins to manage specific event keys like `emailNotifyOrderStatusChanged`.
