# NexaCRM — QA Verification Protocol

## READ THIS FIRST. DO NOT SKIP. DO NOT SKIM.

You are about to act as a Senior QA Engineer, not a developer writing new features. These are different jobs with different mindsets.

A developer's job is to make something work.
A QA Engineer's job is to **prove** whether something actually works, by trying to break it, and to refuse to say "this works" unless they personally watched it work with their own eyes.

You are being given this document because previous work on this project was repeatedly marked "complete" and "fixed" when it was not. Buttons exist that do nothing. Logic exists that doesn't make sense, or doesn't connect to anything real. The person running this project has manually found dozens of these issues by clicking through the software by hand, and they are exhausted. **Your job now is to do that work for them, completely, honestly, and without shortcuts.**

If you finish this document and report that the software is in good shape, but it is not, you have failed at the one job this document gives you. The entire point of QA is honesty about what is broken. There is no reward anywhere in this process for saying things pass when they don't.

---

## PART 0 — THE MINDSET YOU MUST HOLD FOR THIS ENTIRE TASK

Read each of these rules. They are not optional flavor text. They are the actual rules of how QA work is done by real, paid, professional QA engineers.

**Rule 1 — Never trust the code. Trust what happens when you run it.**
Reading a function and thinking "this looks like it should work" is not verification. It is a guess. You must actually run the application, actually click the actual button, and actually watch what actually happens on the actual screen or in the actual network response. If you cannot run the application in your current environment, you must say so explicitly and explain exactly what you were unable to verify — never substitute "I read the code and it looks correct" for "I ran it and confirmed it works."

**Rule 2 — A button that does something is not the same as a button that does the right thing.**
If you click "Save" and the modal closes, that is not proof that saving worked. Maybe it closed because of an error that was silently swallowed. Maybe it saved garbage data. Maybe it saved nothing at all and the modal just closes unconditionally. You must check the actual result: did the data actually appear where it's supposed to appear, in the form it's supposed to be in, visible to the people who are supposed to see it?

**Rule 3 — "It's there" is not "it works."**
A page existing, a component rendering, a button being visible on the screen — none of this means the feature works. The question is never "does this exist." The question is always "if I, a real user, try to use this for its actual intended purpose, does it actually accomplish that purpose, correctly, every time, including when I do something slightly unexpected?"

**Rule 4 — Ask "does this logic make sense" for every single piece of functionality, not just "does it run without crashing."**
This is the part that separates a real QA engineer from someone just clicking buttons. Code can run perfectly, with zero errors, and still be wrong. Examples of logic that "runs fine" but makes no sense:
- A discount field that lets you enter a negative number, making the price go up instead of down, and nothing stops you.
- A "delete" button that doesn't ask for confirmation on a destructive, unrecoverable action.
- A dropdown of "Order Status" that includes a status no order should ever start as, like jumping straight to "Delivered" with no warning.
- A permission check that exists in the frontend (hides a button) but has no matching check on the backend (so the action can still be performed by editing a network request).
- A field that's marked "required" in the form but the backend will accept the request even when that field is empty.
- A search box that searches the field name instead of the field's actual value.
- A date picker that lets you pick a delivery date in the past.
- Numbers that don't add up — a payroll "net salary" that doesn't actually equal gross minus deductions when you do the math yourself.

For every feature you test, after confirming it "works" in the narrow sense of not crashing, you must stop and ask yourself: **"If I were the business owner actually using this every day, would this behavior make sense to me, or would it confuse me, lose me money, or let someone break something?"** If the answer is "this would confuse or harm a real user," it is a bug, even if no error appeared anywhere.

**Rule 5 — If something needs to be built or fixed to make the logic correct, say exactly what.**
Don't just say "this is broken." Say what the correct behavior should have been, why the current behavior is wrong, and what specifically needs to change — a missing backend check, a missing frontend validation, a wrong calculation, a missing confirmation dialog, whatever it is. Be as specific as you would need to be if you were handing this finding to someone who has never seen this part of the code before.

**Rule 6 — Every single claim you make must have evidence.**
"I tested the login page and it works" is not acceptable. The acceptable version is: "I navigated to /login, entered [email] and [password], clicked Sign In, and was redirected to /dashboard within 2 seconds. The dashboard loaded with my name visible in the top right. PASS." If something fails: "I navigated to /login, entered valid credentials, clicked Sign In. Nothing happened — no error, no redirect, no loading state. I checked the browser console and saw: [exact error text]. FAIL — clicking Sign In does not log the user in."

---

## PART 1 — MANDATORY SETUP BEFORE TESTING ANYTHING

You cannot test what you cannot run. Complete every step here before testing a single feature.

### Step 1.1 — Get the application actually running

1. Clone the repository fresh if you haven't already in this session.
2. Read `README.md` at the root and follow it exactly to set up the local environment (database, Redis, environment variables, dependencies).
3. If `README.md` is missing a step, is wrong, or doesn't actually result in a working local environment — **this itself is a finding.** Write it down in your final report under "Setup Issues." Do not silently fix your local copy and move on without recording that the documentation was wrong; the next person will hit the same wall.
4. Confirm the backend starts with no errors in the terminal.
5. Confirm the frontend starts with no errors in the terminal or browser console.
6. Confirm you can reach the login page in a browser.

If you cannot get the application running at all after a genuine, careful attempt, **stop and report exactly what failed, with the exact error messages.** Do not guess at fixes that aren't grounded in the actual error. Do not proceed to "test" a system you can't actually run — that would mean going back to reading code and guessing, which Rule 1 forbids.

### Step 1.2 — Seed test accounts

You need at least three real, working login accounts to test with: one `SUPER_ADMIN`, one `ADMIN`, and one `USER`. Check `apps/api/prisma/seed.ts` for what accounts already exist after seeding. If only one admin account is seeded, create the additional `ADMIN` and `USER` accounts yourself through the application's own "create user" functionality once logged in as `SUPER_ADMIN` — and note whether that user-creation flow itself worked correctly as your very first test.

Write down the exact emails and passwords you end up using. You will need them throughout this process, and the next person reading your report will need them too.

### Step 1.3 — Add test identifiers so testing can be precise (`data-testid`)

As of the current state of this repository, **there are zero `data-testid` attributes anywhere in the frontend.** This makes it impossible to write reliable automated tests, and it also makes manual testing reports vague ("the button near the top" instead of a precise reference).

Before testing each section of the app in Part 2 below, add a `data-testid` attribute to every interactive element you are about to test in that section: every button, every input, every link, every modal, every table, every dropdown, every checkbox. Use clear, descriptive, kebab-case names that describe what the element does, not what it looks like. Examples:

```tsx
<button data-testid="create-order-button">Create Order</button>
<input data-testid="order-field-customerName" />
<div data-testid="order-detail-panel">...</div>
```

Do this incrementally, section by section, as you test — not all at once up front. Commit these additions to git along with your findings for that section (see Part 4, commit rules).

This is not busywork. It is what allows the automated test suite (built separately, described in Part 5) to actually run reliably afterward, and it is what allows anyone reading your report to know exactly which element you mean.

---

## PART 2 — THE FULL TESTING CHECKLIST

Go through every section below, in order. For every single item, you must:

1. Actually perform the action in a real running browser.
2. Record what you expected to happen (this is usually given to you below, taken from the project blueprint).
3. Record what actually happened, precisely.
4. Mark it PASS or FAIL.
5. If FAIL, apply Rule 4 and Rule 5 — explain why it's wrong and what needs to change.
6. If the logic technically "works" but doesn't make sense per Rule 4, mark it **LOGIC ISSUE** even if it's not a crash or visible error, and explain what's wrong with the reasoning.

Test as all three roles (`SUPER_ADMIN`, `ADMIN`, `USER`) wherever the feature's behavior is supposed to differ by role. Where it shouldn't differ, testing as `USER` is enough unless noted.

Do not skip a section because it "seems simple" or because a similar section already passed. Every section gets the same level of scrutiny.

---

### Section 2.1 — Authentication

- [ ] Visiting any protected page (e.g. `/dashboard`) while logged out redirects you to `/login`. It must not show a blank page, an error page, or the protected content itself.
- [ ] Logging in with correct `SUPER_ADMIN` credentials succeeds and lands on the dashboard.
- [ ] Logging in with correct `ADMIN` credentials succeeds and lands on the dashboard.
- [ ] Logging in with correct `USER` credentials succeeds and lands on the dashboard.
- [ ] Logging in with a wrong password shows a clear, visible error message and does NOT log you in.
- [ ] Logging in with an email that doesn't exist shows a clear error (and importantly: the error message should not reveal whether the email exists or not — "invalid email or password" is correct; "no account found with that email" is a security leak that helps attackers guess valid emails. If you find the second pattern, this is a **LOGIC ISSUE**, not just a missing feature.)
- [ ] Submitting the login form with empty fields shows validation errors and does not send a request to the server at all.
- [ ] The "Forgot password?" link — click it. **Known issue going in: this currently points to `href="#"` and does nothing.** Confirm this is still broken, and if so, this needs to be fully built: a working forgot-password page, a backend endpoint that sends a reset email, and a working reset-password page that the emailed link goes to. Do not mark this "fixed" unless you have personally triggered the full flow and received a real, working reset link in an actual email or test inbox.
- [ ] After successfully logging in, refresh the page. You should remain logged in (not bounced back to `/login`).
- [ ] Wait past the access token's expiry (or artificially adjust it down for testing) and confirm the silent refresh-token mechanism keeps you logged in without you noticing, rather than logging you out.
- [ ] Logging out actually logs you out — after clicking logout, visiting a protected page redirects to `/login` again, and the previous access token, if you capture it, no longer works against the API.
- [ ] Attempt to log in as the same user from two different browser sessions at once. Confirm the behavior matches what's expected (the blueprint allows configurable concurrent session limits — check Settings to see what's configured, and confirm actual behavior matches that setting).

---

### Section 2.2 — Orders (the core feature — test this most thoroughly)

**Creating an order**
- [ ] The "Create Order" button is visible and clickable from the Orders page.
- [ ] Clicking it opens a form/modal with all the standard fields (customer name, phone, address, products, price, payment status, delivery date, notes).
- [ ] Submitting the form with all required fields filled in correctly creates the order, and — critically — **the new order actually appears in the orders table afterward.** Don't just confirm the modal closed; search for the specific order you just created and confirm it's really there with the data you entered.
- [ ] Submitting the form with a required field left empty shows a validation error and does NOT create the order.
- [ ] Try entering obviously invalid data on purpose: a negative price, a phone number that's just letters, a delivery date in the past, an extremely long customer name. For each: does the form stop you, or does it silently accept garbage? If it accepts garbage, this is a **LOGIC ISSUE** — explain exactly what validation is missing.
- [ ] The order number is auto-generated and follows the format `NX-YYYY-NNNNN`. Create two orders back to back and confirm the numbers increment correctly and don't collide.

**Viewing and editing orders**
- [ ] Clicking on an order row opens the order detail view with all its data correctly displayed.
- [ ] Editing a field and saving actually persists the change — close the detail view, reopen it, and confirm the new value is still there (not just visually updated and then lost).
- [ ] As a `USER`, try editing an order created by a different user. Per the blueprint, this should be blocked once the configured "edit window" has passed (check Settings for the current window, e.g. 30 minutes) unless you're an `ADMIN`. Test both inside and outside that window if you can control the order's creation timestamp, or test against an old seeded order that's definitely outside the window. Confirm: does the UI block it? Does the backend ALSO block it if you try anyway (check this by inspecting the network request and confirming a 403 comes back — a frontend-only block that the backend doesn't enforce is a real security hole, not a pass)?
- [ ] Changing an order's status (from the detail view, from the table, and from Kanban drag-and-drop if available) actually updates the status everywhere — refresh and confirm it stuck.
- [ ] Every audit log entry for an order (who changed what, when) actually reflects real changes you just made. Make a change, then check the audit log immediately — does your change show up accurately?

**Smart Paste**
- [ ] Find the "smart paste" or "paste order" feature. Paste a realistic block of text like:
  ```
  Name: Test Customer
  Phone: 416-555-0123
  Product: Queen Mattress
  Price: $450
  ```
  Confirm the form fields actually get pre-filled with the correct values extracted from the text — not just that something happened, but that the customer name field literally contains "Test Customer" afterward, the phone field contains the phone number, etc.
- [ ] Paste something messy with a field the system won't recognize, e.g. add a line `Gift Wrap: Yes`. Confirm the system handles this gracefully — either by offering to add it as a new field, or by clearly ignoring it without crashing. Silently dropping data with no indication to the user is a **LOGIC ISSUE**.

**Filtering, search, and views**
- [ ] Use the date range filter (Today, Last 7 days, Custom range, etc). Confirm the table actually changes to show only matching orders — pick a date range you know should return zero results and confirm it shows an empty state, not stale data from before the filter.
- [ ] Use the search box. Search for a customer name you know exists. Confirm it finds it. Search for something that doesn't exist. Confirm it shows a proper "no results" state, not an error or a frozen table.
- [ ] Switch to Kanban view. Confirm orders appear in the correct status columns matching their actual status (not just any column). Drag a card to a different column and confirm the order's actual status changed (check by switching back to table view or refreshing).
- [ ] Switch to Calendar view. Confirm orders appear on the correct date matching their delivery date.
- [ ] Select multiple orders with checkboxes and use bulk actions (status change, export, delete if available). Confirm the bulk action actually applies to all selected orders, not just the first one or a random one.
- [ ] Export orders to Excel/PDF/CSV (whichever exist). Open the exported file. Confirm the data in the file actually matches what's in the table — correct columns, correct values, not garbled, not missing rows, not including orders that were filtered out.

**File attachments**
- [ ] Upload a small image to an order. Confirm it actually appears as an attachment afterward (refresh and check it's still there, not just a temporary preview).
- [ ] Try uploading a file type that should be rejected (e.g. a `.exe` or `.zip` if those are supposed to be blocked) and confirm it's actually rejected with a clear message, not silently failing or silently succeeding.
- [ ] Try uploading a file larger than the configured size limit and confirm it's rejected with a clear message.

---

### Section 2.3 — Status & Field Management (Settings)

- [ ] As `ADMIN`, create a new custom status (e.g. "Awaiting Parts"). Confirm it actually appears as a selectable status option when creating/editing an order afterward.
- [ ] Reorder statuses via drag-and-drop (if available) and confirm the new order persists after a refresh.
- [ ] Try to archive a status that currently has orders assigned to it. Confirm you get a warning showing how many orders are affected, not a silent or destructive action.
- [ ] As `ADMIN`, create a new custom field (e.g. "Gift Wrap Requested," type Checkbox). Confirm it actually appears in the order creation form afterward, for all users, without anyone needing to refresh in a special way.
- [ ] Try making a field required. Confirm orders can no longer be created without filling that field in.
- [ ] As a `USER` (not `ADMIN`), attempt to create a new field. Per the blueprint, users with the right permission can create fields but cannot make them required. Confirm: can a `USER` actually create a field? Is the "make required" option correctly hidden or disabled for them? If a `USER` can create a field but the "required" checkbox is visible and clickable for them, that's a **LOGIC ISSUE** even if clicking it does nothing — a control that looks usable but secretly isn't is confusing and wrong.

---

### Section 2.4 — Users, Groups, and Permissions (IAM)

- [ ] As `SUPER_ADMIN`, create a new user. Confirm they can actually log in afterward with the credentials you set.
- [ ] As `SUPER_ADMIN`, create a new Policy with a specific set of permissions (e.g. only `orders:view`, nothing else). Create a Group, attach this policy to the group, and add your test `USER` account to the group.
- [ ] Log in as that test user. Confirm their actual capabilities in the UI match exactly what the policy granted — they should NOT be able to do things outside that policy, and the relevant buttons/pages for disallowed actions should not just be hidden, but should be genuinely blocked if accessed directly (re-test the direct-URL-access check from Section 2.1's admin page test, but for this specific restricted scenario).
- [ ] Now go back as `SUPER_ADMIN` and remove that policy from the group. Without the test user logging out and back in, confirm whether their permissions update (the blueprint says this should happen via cache invalidation, ideally without requiring a fresh login). If it still requires a fresh login to take effect, note this precisely — is this actually what the blueprint specifies, or a shortcut that was taken?
- [ ] Test a temporary/expiring permission: grant the test user a permission with a short expiry, confirm they have it, wait for it to expire (or adjust the time if you can), and confirm it's actually revoked afterward, not still active.
- [ ] As `SUPER_ADMIN`, suspend a user. Confirm that user can no longer log in, and sees a clear "account suspended" message, not a generic login failure.
- [ ] As `SUPER_ADMIN`, force-logout a user who is currently logged in elsewhere. Confirm their existing session actually stops working (their next API request should fail, not silently keep working until their token naturally expires).

---

### Section 2.5 — Dashboard

- [ ] Log in as `ADMIN`. Confirm the KPI cards show real numbers that you can verify by manually counting (e.g. create 2 new orders, refresh the dashboard, confirm "orders today" went up by exactly 2, not some other number).
- [ ] Confirm the "Since You Were Gone" banner appears and shows accurate information — log out, have a different test session create a new order, then log back in as `ADMIN` and confirm the banner correctly reflects that new order.
- [ ] Log in as `USER`. Confirm their dashboard is scoped to their own data — their KPI numbers should reflect only orders they personally created, not the whole system. Verify this by checking the actual count against what you know to be true.
- [ ] Confirm the `USER` dashboard does NOT show system-wide admin information (top performer, all-user activity feed) — this data should not even be present in the page's network responses for a `USER`, not just visually hidden by CSS.
- [ ] Click "Quick Add Order" from the dashboard and confirm it actually opens the create order flow, the same one tested in Section 2.2.

---

### Section 2.6 — Payroll Module

- [ ] Confirm this module is OFF by default in a fresh setup (per the blueprint). If it's on by default, that's a deviation worth noting.
- [ ] As `ADMIN`, toggle Payroll ON in Settings. Confirm it now appears in the sidebar for relevant users without needing a redeploy or restart.
- [ ] Create an employee. Confirm they appear in the employee list afterward.
- [ ] Create a payroll period for that employee with a gross salary and at least one deduction/advance. **Manually do the math yourself**: does the displayed net salary actually equal gross minus deductions? If the software shows a different number than your own calculation, this is a real bug, not a logic issue — flag it as a calculation error with the exact numbers you used.
- [ ] Generate a salary slip PDF. Open it. Confirm the numbers in the PDF match what's shown in the app — not placeholder text, not zeros, the actual real numbers.
- [ ] Generate the payroll summary Excel export. Open it and confirm it matches the data in the app.
- [ ] Add an advance/deduction to an employee tied to a specific payroll period. Confirm it actually affects that period's net salary calculation correctly.

---

### Section 2.7 — Facebook Accounts Module

- [ ] Confirm this module is OFF by default. Toggle it on as `ADMIN`.
- [ ] Create an FB account entry. Confirm NO actual password field exists anywhere in this form — per the blueprint, only metadata and an encrypted vault note are allowed. If you find an actual password field being stored, this is a serious security/compliance issue — flag it immediately and explain why (see blueprint Section 1, "Facebook passwords" correction).
- [ ] Add a vault note. Confirm it is NOT visible in plain text anywhere by default — it should require an explicit "reveal" action with a password confirmation step. Try to find the encrypted value in a raw API response (e.g. browser dev tools network tab) when just loading the account list — it should not be there in decrypted form.
- [ ] Change an account's status (e.g. Active to Restricted). Confirm this creates an entry in that account's status history log with the correct old and new values.

---

### Section 2.8 — Notifications & Announcements

- [ ] As `ADMIN`, post an announcement. Confirm it appears for a `USER` on their dashboard without that user needing to do anything special.
- [ ] Trigger an event that should cause a notification (e.g. change the status of an order created by a different user). Confirm the notification bell shows an updated unread count for the relevant user, and clicking it shows the actual notification with correct content, not a placeholder.
- [ ] Click a notification and confirm it actually navigates to the relevant record (e.g. the order that changed), not just to a generic page.
- [ ] If email notifications are configured and testable in your environment, trigger an event and confirm a real email actually arrives with correct content. If you cannot test real email sending in your environment, say so explicitly rather than assuming it works.
- [ ] In Settings, turn off email notifications for a specific event type. Trigger that event again. Confirm no email is sent this time (or, if you can't verify email delivery directly, at minimum confirm the code path that would have sent it is correctly skipped — check logs).

---

### Section 2.9 — Settings (General Admin Configuration)

- [ ] Change the "edit window" setting from its default to a different value (e.g. 30 minutes to 5 minutes). Go test an order edit per Section 2.2's edit window test again — confirm the NEW value is actually what's being enforced, not the old one cached somewhere.
- [ ] Change the appearance/theme color. Confirm it actually applies across the whole app, not just the settings page itself.
- [ ] Toggle Light/Dark mode. Click through several different pages in dark mode and confirm every page actually looks correct — no white-on-white text, no unreadable contrast, no components that were clearly never tested in dark mode.
- [ ] Change the company name/logo. Confirm it appears correctly wherever it's supposed to (e.g. PDF export headers, email templates) — not just on the settings page where you set it.

---

### Section 2.10 — Global Search

- [ ] Trigger the global search (Cmd+K or Ctrl+K, or whatever shortcut/button exists). Confirm it actually opens.
- [ ] Search for an order you know exists by customer name. Confirm it appears in results and clicking it navigates to that order.
- [ ] As a `USER`, search for something that should only return admin-scoped results (like another user's name, if users are searchable). Confirm `USER` does not see results they shouldn't have access to.

---

### Section 2.11 — General Cross-Cutting Checks

- [ ] Resize the browser window to a tablet width (roughly 768px) and a mobile width (roughly 375px). Click through the main pages. Note anywhere the layout breaks, overlaps, or becomes unusable.
- [ ] Open the browser developer console and click through every major page. Note any red errors that appear in the console, even if the page visually seems fine — a console error often means something silently failed.
- [ ] Open the Network tab and click through several pages. Note any API requests that return 4xx or 5xx errors, even if the UI doesn't visibly show anything wrong about it.
- [ ] Try the keyboard-only path through a key flow (e.g. Tab through the login form and press Enter to submit, without touching the mouse). Confirm it works.

---

## PART 3 — HOW TO RECORD YOUR FINDINGS

Create a single file at the root of the repository named `QA_REPORT.md`. For every checklist item above, write an entry in this exact format:

```markdown
### [Section number] — [Item description]
**Status:** PASS / FAIL / LOGIC ISSUE / COULD NOT TEST
**What I did:** [exact steps you took]
**What I expected:** [taken from the checklist item or blueprint]
**What actually happened:** [precise, specific observation]
**Evidence:** [exact error text, screenshot description, network response code, or calculation you did by hand]
**If FAIL or LOGIC ISSUE — what needs to change:** [specific, actionable fix]
```

Do not summarize multiple checklist items into one vague entry. Each item gets its own entry, even if several pass in a row and feel repetitive to write. The repetitiveness is the point — it proves each one was actually checked individually rather than assumed.

At the very top of `QA_REPORT.md`, include a summary table:

```markdown
| Section | Total Items | Pass | Fail | Logic Issue | Could Not Test |
|---|---|---|---|---|---|
| 2.1 Authentication | 12 | ... | ... | ... | ... |
| 2.2 Orders | ... | ... | ... | ... | ... |
[etc.]
```

---

## PART 4 — COMMIT RULES WHILE DOING THIS WORK

Follow the same Git discipline as the rest of this project (see `CRM_Blueprint.md` Section 0 if you need a reminder):

- Commit after finishing each numbered Section (2.1, 2.2, etc.), not after the whole document.
- Commit message format: `[QA] Section 2.X — N pass, N fail, N logic issues`
- Include both your `data-testid` additions and your `QA_REPORT.md` updates for that section in the same commit.
- Do not wait until the very end to write `QA_REPORT.md` — write it as you go, section by section, so that if your session ends unexpectedly, the findings up to that point are not lost.
- If you have to stop partway through, update `HANDOVER.md` (recreate it if it was deleted) noting exactly which section you were on and what's left, following the same handover protocol as the rest of the project.

---

## PART 5 — WHAT HAPPENS AFTER THIS

Once `QA_REPORT.md` is complete with every single checklist item in Part 2 addressed, this report becomes the new punch list. A separate piece of work will use this report to fix every FAIL and LOGIC ISSUE you found, one at a time, with the same rigor — and that work will be re-verified against this same checklist afterward, not just trusted.

Your job in this document is only to find and clearly document the truth. You are not expected to fix everything yourself in this same pass — though if a fix is small, obvious, and you're confident about it (like the missing `data-testid` attributes, or a clearly missing confirmation dialog on a delete button), you may fix it as you go, as long as you still record it honestly in the report as something that was found broken and then fixed, with what you changed.

**Do not, under any circumstance, mark something as PASS to make the report look better, to finish faster, or because you assume it probably works. The entire value of this document depends on it being completely honest. A report full of FAIL is more useful than a report full of false PASS — the person reading this has already been burned by false completeness once, and a second time will cost them far more than your honesty costs you.**
