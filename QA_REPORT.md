# NexaCRM QA Report

| Section | Total Items | Pass | Fail | Logic Issue | Could Not Test |
|---|---|---|---|---|---|
| 2.1 Authentication | 12 | 10 | 2 | 0 | 0 |
| 2.2 Orders | 22 | 11 | 8 | 3 | 0 |
| 2.3 Status & Field Management | 6 | 0 | 0 | 0 | 0 |
| 2.4 Users, Groups, and Permissions | 7 | 0 | 0 | 0 | 0 |
| 2.5 Dashboard | 5 | 0 | 0 | 0 | 0 |
| 2.6 Payroll Module | 7 | 0 | 0 | 0 | 0 |
| 2.7 Facebook Accounts Module | 4 | 0 | 0 | 0 | 0 |
| 2.8 Notifications & Announcements | 5 | 0 | 0 | 0 | 0 |
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
