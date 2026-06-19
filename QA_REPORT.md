# NexaCRM QA Report

| Section | Total Items | Pass | Fail | Logic Issue | Could Not Test |
|---|---|---|---|---|---|
| 2.1 Authentication | 12 | 10 | 2 | 0 | 0 |
| 2.2 Orders | 18 | 0 | 0 | 0 | 0 |
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
