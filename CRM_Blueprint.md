# NexaCRM — Complete Technical Blueprint
### Sales & Marketing Operations Platform | Mattress/Bedframe Business, Canada

---

## CRITICAL: HOW TO READ THIS DOCUMENT

This is the single source of truth for building NexaCRM. Every agent working on this project must read this entire document before writing a single line of code. Do not skip sections. Do not assume. If something is unclear, refer back to this document first.

This project is built across multiple sessions, potentially across multiple AI agents. The Git repository and HANDOVER.md file are the continuity mechanism. Every agent must update HANDOVER.md at the end of every session before stopping work.

---

## SECTION 0: GIT & HANDOVER PROTOCOL

This section is the most important operational rule of the entire project. Follow it without exception.

### Repository Setup (first agent only, Phase 1 Step 1)

Initialize a Git repository and push to GitHub immediately at the start of Phase 1:

```bash
git init
git remote add origin https://github.com/<username>/nexacrm.git
git branch -M main
```

Create a `.gitignore` that excludes: `node_modules/`, `.env`, `dist/`, `build/`, `uploads/`, `.turbo/`, `*.log`, `.DS_Store`

### Commit Rules — Non-Negotiable

After completing every file, every feature, every phase step — commit immediately. Do not batch work across multiple steps without committing. The commit message format is:

```
[PHASE-X / STEP-Y] Short description of what was completed

- Bullet of specific files created or modified
- Bullet of any decisions made that differ from blueprint
- Bullet of anything left incomplete in this step (if any)
```

Examples:
```
[PHASE-1 / STEP-3] Auth system: login, logout, refresh token rotation

- Created apps/api/src/routes/auth.routes.ts
- Created apps/api/src/services/auth.service.ts
- Created apps/api/src/middleware/authenticate.ts
- Decision: used argon2 instead of bcrypt (same security, better performance)
```

Push after every commit:
```bash
git add -A
git commit -m "[PHASE-X / STEP-Y] description"
git push origin main
```

### HANDOVER.md — Structure and Lifecycle

The file lives at the root of the repository: `/HANDOVER.md`

Every agent rewrites this file completely at the end of their session. It is not appended — it is fully overwritten with the current state. The structure is always:

```markdown
# NexaCRM — Handover State

## Last Updated
[ISO timestamp] — [Phase X, Step Y completed]

## What Was Just Completed
[Precise description of what was built in this session. Be specific about files, logic, decisions.]

## Current Project State
[What exists and works right now. What has been tested and confirmed working.]

## What Is Next
[The exact next step from the Build Order in Section 9 of the blueprint. Copy it verbatim.]

## Known Issues / Decisions Made
[Any deviations from the blueprint and why. Any bugs discovered but not yet fixed. Any technical debt.]

## Environment Notes
[Any env vars added, any config changes, anything the next agent needs to know about the environment.]

## How to Resume
[Exact commands to run to get the dev environment running from a fresh checkout of the repo.]
```

### HANDOVER.md Removal

When Phase 9 (Testing & Deployment) is fully complete — all tests passing, all QA gates passed, software deployed and smoke-tested — delete HANDOVER.md from the repository:

```bash
git rm HANDOVER.md
git commit -m "[PHASE-7 / FINAL] Project complete — removing handover file"
git push origin main
```

This is the only signal that the project is done. If HANDOVER.md exists in the repo, the project is not complete.

### New Agent Startup Checklist

Every new agent starting a session must do this before anything else:

1. Read HANDOVER.md — understand exactly where things stand
2. Read this blueprint document in full if not already done
3. Run the "How to Resume" commands from HANDOVER.md
4. Verify the dev environment starts without errors
5. Only then begin work on the next step

---

## SECTION 1: PROJECT UNDERSTANDING & SCOPE CORRECTIONS

### What the Client Has
A Canadian mattress/bedframe/boxspring sales business operating via Facebook Marketplace. Currently tracking all orders manually via WhatsApp with no structure. Multiple staff members enter and manage orders. The business needs a complete internal CRM to digitize all operations.

### What Was Missing From the Original Brief

- No mention of file attachments per order (customers send photos of damage, delivery addresses, etc.)
- No mention of audit logs (essential — who changed what, when)
- No mention of notifications system (in-app + email when order status changes)
- No mention of data backup strategy
- No mention of API rate limiting or abuse prevention
- Payroll and Facebook account management mentioned but not detailed — these are fully built but toggled off by default
- No mention of timezone handling (Canada spans 6 time zones — all timestamps stored UTC, displayed in configurable warehouse timezone)
- No mention of soft deletes (deleted data recoverable for grace period)
- No mention of session management (shared warehouse computers are a real security risk)
- No mention of multi-language support (English default, French toggle for Quebec)

### What Was Described Incorrectly

**"A new sheet per day"** — This is not how databases work. The correct implementation is one unified orders table with date-range filters that behave exactly like separate sheets. Building literal daily tables would make the system unmaintainable. The date filter UX matches what was described exactly — it just works through queries.

**"Add any new functionality through GUI"** — Realistic scope: admins can create custom fields, custom statuses, custom roles, and custom views through the GUI with no code. Every foreseeable module is built upfront with admin toggle switches to activate or deactivate them. This is the correct architecture.

**"Facebook passwords with encryption"** — Storing Facebook credentials in any system is a legal liability and violates Facebook's Terms of Service. The correct approach: store account metadata only (name, email, status, notes, assigned user) plus one AES-256 encrypted vault note field for operator reference text. No raw passwords stored anywhere.

---

## SECTION 2: TECH STACK

All tools are free and open source unless noted. No paid services required to build or run this project.

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Component Library | shadcn/ui |
| State Management | Zustand |
| Server State / Caching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Date Handling | date-fns + date-fns-tz |
| Rich Text Editor | TipTap |
| Drag and Drop | dnd-kit |
| Icons | Lucide React |
| Toast Notifications | react-hot-toast |
| PDF Export (client) | jsPDF + jspdf-autotable |
| Excel Export (client) | xlsx (SheetJS community edition) |
| HTTP Client | Axios |
| Routing | React Router v6 |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js v5 |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Auth | JWT (access token + refresh token pattern) |
| Password Hashing | Argon2 |
| Encryption | Node.js crypto module (AES-256-GCM) |
| File Storage | Multer (local dev) → Cloudflare R2 (production) |
| Email | Nodemailer |
| Validation | Zod |
| Rate Limiting | express-rate-limit |
| Security Headers | Helmet.js |
| CORS | cors middleware |
| Logging | Winston |
| Background Jobs | Bull + Redis |
| API Documentation | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |
| Excel Export (server) | ExcelJS |
| PDF Export (server) | PDFKit |

### Infrastructure (all free tiers)

| Component | Service |
|---|---|
| Frontend Hosting | Vercel |
| Backend Hosting | Railway or Render |
| Database | Supabase (PostgreSQL) |
| Cache + Queue | Upstash (Redis) |
| File Storage | Cloudflare R2 |
| CI/CD | GitHub Actions |
| Monitoring | Better Stack (Logtail free tier) |
| SSL | Let's Encrypt (automatic via Vercel/Render) |

### Monorepo Structure

```
nexacrm/
├── apps/
│   ├── web/          ← React frontend (Vite + TypeScript)
│   └── api/          ← Express backend (TypeScript)
├── packages/
│   └── shared/       ← Shared Zod schemas, TypeScript types, constants
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── turbo.json
├── HANDOVER.md       ← Deleted when project is complete
└── README.md
```

---

## SECTION 3: COMPLETE FEATURE LIST

### Module 1: Authentication & Authorization

**Roles:**
- `SUPER_ADMIN` — Full access. Cannot be deleted. Only one exists (created by seed).
- `ADMIN` — Full access except creating other admins.
- `USER` — Limited default access.

**Permission System (mirrors AWS IAM concepts, simplified):**

All permissions are named strings:
`orders:create`, `orders:edit_own`, `orders:edit_any`, `orders:delete_own`, `orders:delete_any`, `status:create`, `status:manage`, `fields:create`, `fields:make_required`, `payroll:view`, `payroll:edit`, `fb_accounts:view`, `fb_accounts:edit`, `users:view`, `users:manage`, `settings:access`, `announcements:manage`, `audit:view`

**Policies** — Named collections of permissions. Example: "Warehouse Supervisor Policy" contains `orders:edit_any` and `orders:delete_any`.

**Groups** — Named collections of users. A group can have one or more policies attached. All users in the group inherit those permissions.

**User-level policy assignment** — Individual users can be assigned policies directly, separate from groups.

**Temporary permission elevation** — Admin assigns a permission with an expiry datetime. After expiry, it auto-revokes. A background job checks for expired temporary assignments every 5 minutes.

**Edit window** — Configurable by Admin (default: 30 minutes). After the window, only Admins can edit user-created entries. Window duration stored in settings table.

**Default USER permissions:**
- Create orders
- View all orders (read only)
- Edit and delete own orders within the edit window
- Create new statuses
- Delete statuses they created (only if empty)
- Add new fields (but not make them required)

**Session management:**
- Configurable idle session timeout (default 30 minutes)
- Admin can force-logout any user (invalidates all their active sessions)
- Refresh token rotation on every use
- Token family tracking to detect refresh token reuse attacks

**Account suspension:**
- Admin can suspend any user
- Suspended user sees a clear "Account suspended" screen on next login attempt

### Module 2: Dashboard

The dashboard is role-aware. Admins and users see different views.

**"Since You Were Gone" Banner (both roles)**
- Appears only if there has been activity since the user's last login
- Powered by `previous_login` timestamp (see Implementation Notes, point 16)
- Admin version: "X new orders added, Y status changes, Z new users registered" — each item links to the relevant filtered view
- User version: "X of your orders had status updates" — links to their orders filtered to recently changed
- Dismissible per session; does not reappear until next login

**Admin Dashboard:**
- Since You Were Gone banner
- New entries since last login — dedicated table widget, orders where `createdAt > previousLoginAt`, sorted newest first, columns: Order#, Customer, Status, Created By, Created At
- KPI cards (system-wide): Total orders today, this week, this month vs last month with % change, active users today
- Orders by status (donut chart, all users)
- Orders trend (line chart, last 30 days)
- Top performing user this week
- Today's deliveries (all orders with delivery date = today)
- Recent Activity Feed (last 30 actions, system-wide)
- Announcements manager (quick edit/delete own announcements, post new)
- Quick Add Order button (always visible, top-right)

**User Dashboard:**
- Since You Were Gone banner (scoped to own orders only)
- Quick Add Order button (most prominent element — primary action)
- KPI cards (own entries only): My orders today, this week, this month
- My recent orders (last 10 created by this user, with current status)
- Today's deliveries (system-wide — operational awareness)
- Active announcements from Admin (read-only, pinned)

### Module 3: Orders (Core Module)

**Standard pre-built fields (cannot be deleted, only hidden):**
- Customer Name (required, TEXT)
- Order Number (auto-generated NX-YYYY-NNNNN, readonly)
- Order Status (required, SELECT — determines which status view it appears in)
- Customer Phone (PHONE)
- Delivery Address (ADDRESS)
- Order Date (auto-set, DATE)
- Delivery Date (DATE)
- Products Ordered (TEXTAREA)
- Price (NUMBER)
- Payment Status (SELECT: Paid / Unpaid / Partial)
- Notes (TEXTAREA)
- Created By (auto-set, readonly)

**Dynamic custom fields:**
- Any user with `fields:create` permission can add new fields
- Only Admin can make a field required
- Admin marks fields as global (appears for all statuses) or status-specific
- Field types: TEXT, NUMBER, DATE, PHONE, EMAIL, SELECT, MULTISELECT, CHECKBOX, TEXTAREA, ADDRESS
- Field reordering via drag-and-drop in Settings
- Fields added by users are immediately visible to all users in the order form

**Order entry methods:**
1. Manual — fill form field by field
2. Smart Paste — paste raw WhatsApp/Facebook text, system auto-maps to fields (see Section 11)
3. Duplicate — clone an existing order and modify

**Views:**
- Table View (default) — sortable, filterable, global search
- Kanban View — cards grouped by status, drag card to change status
- Calendar View — orders plotted on delivery date, click day to see orders

**Date range filter:**
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Last month
- Custom range (date picker)

**Search:**
- Global search across all fields in the current view
- Results highlighted inline
- Navigate matches with Up/Down arrow keys
- Scope toggle: This Status / All Statuses / Date Range

**Filters:**
- By status
- By any field value
- By created by (user)
- By order date range
- By delivery date range
- Multiple filters combine with AND logic

**Bulk actions:**
- Select multiple orders via checkboxes
- Bulk status change
- Bulk delete (Admin only, requires typed confirmation)
- Bulk export selected rows

**Export options:**
- Current view → Excel (.xlsx)
- Current view → PDF (table format with company header)
- Current view → CSV
- Single entry → formatted text copy (for WhatsApp sharing, all fields and values structured)
- Selected entries → formatted text copy

**Per-order audit log:**
- Every field change logged: who, what field, old value, new value, timestamp
- Visible in order detail panel as expandable section

**File attachments per order:**
- Upload photos, documents per order
- Stored in Cloudflare R2
- Displayed as thumbnails in order detail panel

### Module 4: Status Management

- Sidebar shows all statuses as colored badges
- Click status → filters order table to that status
- "All Orders" view clears status filter
- Admin can create, rename, recolor, reorder, archive statuses
- Users with `status:create` can create statuses but not modify others'
- Archiving hides status from new order creation but existing orders remain findable
- Archiving a status that has orders shows a warning with order count

### Module 5: User & Permissions Management

**Users sub-module:**
- Table: name, email, role, status, last login, entry count
- Create new user (name, email, temp password, role)
- Edit user profile
- View effective permissions (resolved from all sources — individual policies + group policies)
- Suspend / unsuspend
- Force logout all sessions
- Per-user activity log

**Policies sub-module:**
- Create named policy with checkbox list of all permissions
- Edit policy → changes propagate immediately to all attached users/groups

**Groups sub-module:**
- Create group (name, description)
- Add/remove users from group
- Attach/detach policies from group

**Temporary assignments:**
- Assign policy to user with expiry datetime
- System auto-revokes on expiry
- Admin sees a list of all upcoming expiries

### Module 6: Settings (Admin only — no code required for any setting)

**General Settings:**
- Company name and logo
- Timezone
- Language (English / French)
- Edit window duration (minutes)
- Session idle timeout (minutes)
- Date format

**Order Fields Settings:**
- View, add, edit, reorder, toggle visibility, make required/optional, delete custom fields

**Status Settings:**
- Full status management UI (same as Module 4 but in settings context)

**Appearance Settings:**
- Light / Dark mode toggle
- Primary accent color picker
- Company logo upload

**Notification Settings:**
- Toggle in-app notifications on/off
- Toggle email notifications per event type

**Module Toggles:**
- Payroll module: ON/OFF
- Facebook Accounts module: ON/OFF

### Module 7: Notifications

- Notification bell in top navbar with unread count badge
- Dropdown with notification list (mark as read, mark all read)
- Click notification → navigate to relevant record
- Email notifications via Nodemailer
- Notification events: order status changed, order assigned, account modified, announcement posted, temporary permission expiring

### Module 8: Announcements

- Admin can post rich-text announcements
- Users see active announcements on their dashboard
- Admin can archive or delete announcements

### Module 9: Payroll Module (built, toggled OFF by default)

**Employees registry:**
- Name, role, joining date, base salary, payment schedule (weekly/biweekly/monthly)

**Payroll entries:**
- Pay period, gross salary, deductions (taxes, advances), net salary, status (Paid/Pending)

**Advances and deductions log:**
- Track money given early or withheld, linked to payroll period

**Payroll dashboard:**
- Total payroll this month
- Upcoming payroll (next 7 days)
- Employee breakdown (bar chart)
- Paid vs pending (donut chart)

**Export:**
- PDF salary slip per employee per period
- Excel payroll summary for any date range

### Module 10: Facebook Accounts Module (built, toggled OFF by default)

Fields per account: display name, linked email, status (Active/Restricted/Banned/Under Review), creation date, last activity date, notes, assigned to (employee), vault note (AES-256 encrypted, revealed only on explicit click with password confirmation)

**Views:**
- Table with all accounts, filter by status and assigned user
- Status history log per account

### Module 11: Audit Log (Admin only)

- Every create, update, delete in the system logged
- Logged data: who, which entity, what changed (diff), when, from which IP
- Non-deletable (even by Admin)
- Filterable by user, action type, entity type, date range
- Exportable to PDF and Excel

### Module 12: Global Search

- Trigger with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- Searches across orders, users (Admin only), statuses, announcements
- Results grouped by category
- Keyboard navigable (arrow keys + Enter)
- Recent searches stored in localStorage

---

## SECTION 4: SECURITY ARCHITECTURE

### Authentication
- JWT access tokens: 15-minute expiry
- JWT refresh tokens: 7-day expiry, stored in HttpOnly cookie (not accessible by JavaScript)
- Refresh token rotation on every use
- Token family tracking: if a used refresh token is presented again, all sessions for that user are immediately invalidated (reuse attack detected)
- Argon2 password hashing
- Rate limiting on all `/api/auth/*` endpoints: 10 attempts per 15 minutes per IP
- Account lockout: 5 consecutive failed logins → 15 minute lockout (stored in Redis)

### Authorization
Every API route protected by middleware that:
1. Verifies JWT signature
2. Checks token not in Redis revocation blacklist
3. Resolves user's effective permissions from Redis cache
4. Checks required permission for that route

Row-level security is enforced at the API layer: users can only edit/delete their own orders, enforced in the service layer, not just the frontend.

### Input Security
- All inputs sanitized server-side
- SQL injection: impossible via Prisma's parameterized queries
- XSS: Helmet.js CSP headers + DOMPurify on all rich text inputs
- CORS: whitelist only the production frontend domain
- HTTPS: enforced via hosting platform (automatic)
- General rate limiting: 100 requests per minute per IP across all endpoints

### Data Security
- Vault fields encrypted with AES-256-GCM
- Encryption key stored as environment variable, never in code or database
- All API responses strip sensitive internal fields before sending
- Soft deletes everywhere — no data is permanently destroyed without admin intent

### Session Security
- Configurable idle timeout (default 30 minutes)
- Admin can invalidate all sessions for any user instantly
- All sessions stored in Redis with TTL equal to refresh token expiry

---

## SECTION 5: DATABASE SCHEMA

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','USER') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  previous_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
)

-- Sessions (refresh tokens)
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR NOT NULL,
  family_id UUID NOT NULL,
  ip_address VARCHAR,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
)

-- Permissions & IAM
permissions (id UUID, name VARCHAR UNIQUE, description TEXT, module VARCHAR)
policies (id UUID, name VARCHAR, description TEXT, created_by UUID, created_at TIMESTAMPTZ)
policy_permissions (policy_id UUID, permission_id UUID)
groups (id UUID, name VARCHAR, description TEXT, created_by UUID, created_at TIMESTAMPTZ)
group_members (group_id UUID, user_id UUID, added_at TIMESTAMPTZ, added_by UUID)
group_policies (group_id UUID, policy_id UUID, added_at TIMESTAMPTZ)
user_policies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  policy_id UUID REFERENCES policies(id),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
)

-- Core: statuses
statuses (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  color VARCHAR NOT NULL,
  icon VARCHAR,
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  position INTEGER NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Core: fields
fields (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT true,
  options JSONB,
  position INTEGER NOT NULL,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Status-specific fields (when is_global = false)
status_fields (status_id UUID, field_id UUID)

-- Core: orders
orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR UNIQUE NOT NULL,
  status_id UUID REFERENCES statuses(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  delivery_date DATE,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  notes TEXT
)

-- Order number sequence (per year)
order_sequences (year INTEGER PRIMARY KEY, last_number INTEGER DEFAULT 0)

-- Attachments
attachments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
)

-- Audit log per order
order_audit_log (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  field_name VARCHAR,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Announcements
announcements (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT,
  link VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Settings
settings (
  id UUID PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- System audit log (non-deletable)
system_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  diff JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Payroll module
employees (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  joining_date DATE,
  base_salary NUMERIC(10,2),
  payment_schedule VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id)
)

payroll_periods (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_salary NUMERIC(10,2),
  deductions JSONB DEFAULT '{}',
  net_salary NUMERIC(10,2),
  status VARCHAR DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id)
)

advances (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  amount NUMERIC(10,2),
  reason TEXT,
  date DATE,
  payroll_period_id UUID REFERENCES payroll_periods(id),
  created_by UUID REFERENCES users(id)
)

-- Facebook accounts module
fb_accounts (
  id UUID PRIMARY KEY,
  display_name VARCHAR NOT NULL,
  linked_email VARCHAR,
  status VARCHAR NOT NULL,
  creation_date DATE,
  last_activity_date DATE,
  notes TEXT,
  assigned_to UUID REFERENCES users(id),
  vault_note_encrypted TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

fb_account_status_log (
  id UUID PRIMARY KEY,
  fb_account_id UUID REFERENCES fb_accounts(id),
  old_status VARCHAR,
  new_status VARCHAR NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT
)
```

---

## SECTION 6: COMPLETE FILE TREE

```
nexacrm/
│
├── HANDOVER.md                           ← Deleted when project is complete
│
├── apps/
│   │
│   ├── web/                              ← FRONTEND
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── logo.svg
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/                   ← shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── calendar.tsx
│   │   │   │   │   ├── popover.tsx
│   │   │   │   │   ├── sheet.tsx
│   │   │   │   │   ├── tabs.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── avatar.tsx
│   │   │   │   │   ├── skeleton.tsx
│   │   │   │   │   ├── switch.tsx
│   │   │   │   │   ├── checkbox.tsx
│   │   │   │   │   ├── textarea.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── separator.tsx
│   │   │   │   │   └── tooltip.tsx
│   │   │   │   │
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppShell.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Topbar.tsx
│   │   │   │   │   ├── NotificationBell.tsx
│   │   │   │   │   ├── GlobalSearch.tsx
│   │   │   │   │   └── ThemeToggle.tsx
│   │   │   │   │
│   │   │   │   ├── orders/
│   │   │   │   │   ├── OrdersTable.tsx
│   │   │   │   │   ├── OrdersKanban.tsx
│   │   │   │   │   ├── OrdersCalendar.tsx
│   │   │   │   │   ├── OrderRow.tsx
│   │   │   │   │   ├── OrderCard.tsx
│   │   │   │   │   ├── OrderDetail.tsx
│   │   │   │   │   ├── OrderAuditLog.tsx
│   │   │   │   │   ├── CreateOrderModal.tsx
│   │   │   │   │   ├── EditOrderModal.tsx
│   │   │   │   │   ├── OrderPasteParser.tsx
│   │   │   │   │   ├── DynamicFieldRenderer.tsx
│   │   │   │   │   ├── OrderFilters.tsx
│   │   │   │   │   ├── DateRangeFilter.tsx
│   │   │   │   │   ├── OrderExporter.tsx
│   │   │   │   │   └── BulkActionBar.tsx
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── SinceYouWereGoneBanner.tsx
│   │   │   │   │   ├── NewEntriesWidget.tsx
│   │   │   │   │   ├── KpiCard.tsx
│   │   │   │   │   ├── OrdersByStatusChart.tsx
│   │   │   │   │   ├── OrdersTrendChart.tsx
│   │   │   │   │   ├── AnnouncementsWidget.tsx
│   │   │   │   │   ├── RecentActivityFeed.tsx
│   │   │   │   │   ├── TodayDeliveriesWidget.tsx
│   │   │   │   │   └── MyRecentOrdersWidget.tsx
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   │   ├── ResetPasswordPage.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   │
│   │   │   │   ├── admin/
│   │   │   │   │   ├── UsersTable.tsx
│   │   │   │   │   ├── CreateUserModal.tsx
│   │   │   │   │   ├── EditUserModal.tsx
│   │   │   │   │   ├── UserPermissionsPanel.tsx
│   │   │   │   │   ├── EffectivePermissionsView.tsx
│   │   │   │   │   ├── PoliciesTable.tsx
│   │   │   │   │   ├── CreatePolicyModal.tsx
│   │   │   │   │   ├── GroupsTable.tsx
│   │   │   │   │   └── CreateGroupModal.tsx
│   │   │   │   │
│   │   │   │   ├── settings/
│   │   │   │   │   ├── SettingsPage.tsx
│   │   │   │   │   ├── GeneralSettings.tsx
│   │   │   │   │   ├── FieldsSettings.tsx
│   │   │   │   │   ├── StatusSettings.tsx
│   │   │   │   │   ├── AppearanceSettings.tsx
│   │   │   │   │   ├── NotificationSettings.tsx
│   │   │   │   │   └── ModuleToggles.tsx
│   │   │   │   │
│   │   │   │   ├── payroll/
│   │   │   │   │   ├── PayrollDashboard.tsx
│   │   │   │   │   ├── EmployeesTable.tsx
│   │   │   │   │   ├── CreateEmployeeModal.tsx
│   │   │   │   │   ├── PayrollPeriodsTable.tsx
│   │   │   │   │   ├── CreatePayrollModal.tsx
│   │   │   │   │   ├── AdvancesTable.tsx
│   │   │   │   │   └── SalarySlipExporter.tsx
│   │   │   │   │
│   │   │   │   ├── fb-accounts/
│   │   │   │   │   ├── FbAccountsTable.tsx
│   │   │   │   │   ├── CreateFbAccountModal.tsx
│   │   │   │   │   ├── EditFbAccountModal.tsx
│   │   │   │   │   ├── FbAccountStatusLog.tsx
│   │   │   │   │   └── VaultNoteReveal.tsx
│   │   │   │   │
│   │   │   │   └── shared/
│   │   │   │       ├── ConfirmDialog.tsx
│   │   │   │       ├── LoadingSpinner.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       ├── DataTable.tsx
│   │   │   │       ├── FileUploader.tsx
│   │   │   │       ├── RichTextEditor.tsx
│   │   │   │       ├── ColorPicker.tsx
│   │   │   │       ├── IconPicker.tsx
│   │   │   │       └── PageHeader.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── usePermissions.ts
│   │   │   │   ├── useOrders.ts
│   │   │   │   ├── useStatuses.ts
│   │   │   │   ├── useFields.ts
│   │   │   │   ├── useUsers.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   ├── useSettings.ts
│   │   │   │   ├── usePayroll.ts
│   │   │   │   ├── useFbAccounts.ts
│   │   │   │   ├── useExport.ts
│   │   │   │   ├── useGlobalSearch.ts
│   │   │   │   └── useTheme.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── uiStore.ts
│   │   │   │   ├── filterStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── queryClient.ts
│   │   │   │   ├── utils.ts
│   │   │   │   ├── exportHelpers.ts
│   │   │   │   ├── pasteParser.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── dateHelpers.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── pages/
│   │   │       ├── index.tsx
│   │   │       ├── login.tsx
│   │   │       ├── dashboard.tsx
│   │   │       ├── orders.tsx
│   │   │       ├── admin/
│   │   │       │   ├── users.tsx
│   │   │       │   ├── groups.tsx
│   │   │       │   ├── policies.tsx
│   │   │       │   └── audit-log.tsx
│   │   │       ├── settings.tsx
│   │   │       ├── payroll.tsx
│   │   │       ├── fb-accounts.tsx
│   │   │       ├── profile.tsx
│   │   │       └── 404.tsx
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                              ← BACKEND
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   │
│       │   ├── config/
│       │   │   ├── env.ts
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   └── logger.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── authenticate.ts
│       │   │   ├── authorize.ts
│       │   │   ├── rateLimiter.ts
│       │   │   ├── errorHandler.ts
│       │   │   ├── requestLogger.ts
│       │   │   ├── validateBody.ts
│       │   │   └── auditLogger.ts
│       │   │
│       │   ├── routes/
│       │   │   ├── index.ts
│       │   │   ├── auth.routes.ts
│       │   │   ├── orders.routes.ts
│       │   │   ├── statuses.routes.ts
│       │   │   ├── fields.routes.ts
│       │   │   ├── users.routes.ts
│       │   │   ├── groups.routes.ts
│       │   │   ├── policies.routes.ts
│       │   │   ├── permissions.routes.ts
│       │   │   ├── notifications.routes.ts
│       │   │   ├── announcements.routes.ts
│       │   │   ├── settings.routes.ts
│       │   │   ├── payroll.routes.ts
│       │   │   ├── fb-accounts.routes.ts
│       │   │   ├── audit.routes.ts
│       │   │   ├── search.routes.ts
│       │   │   ├── attachments.routes.ts
│       │   │   └── export.routes.ts
│       │   │
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── orders.controller.ts
│       │   │   ├── statuses.controller.ts
│       │   │   ├── fields.controller.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── groups.controller.ts
│       │   │   ├── policies.controller.ts
│       │   │   ├── notifications.controller.ts
│       │   │   ├── announcements.controller.ts
│       │   │   ├── settings.controller.ts
│       │   │   ├── payroll.controller.ts
│       │   │   ├── fb-accounts.controller.ts
│       │   │   ├── audit.controller.ts
│       │   │   ├── search.controller.ts
│       │   │   ├── attachments.controller.ts
│       │   │   └── export.controller.ts
│       │   │
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── orders.service.ts
│       │   │   ├── statuses.service.ts
│       │   │   ├── fields.service.ts
│       │   │   ├── users.service.ts
│       │   │   ├── groups.service.ts
│       │   │   ├── policies.service.ts
│       │   │   ├── permissions.service.ts
│       │   │   ├── notifications.service.ts
│       │   │   ├── email.service.ts
│       │   │   ├── announcements.service.ts
│       │   │   ├── settings.service.ts
│       │   │   ├── payroll.service.ts
│       │   │   ├── fb-accounts.service.ts
│       │   │   ├── audit.service.ts
│       │   │   ├── search.service.ts
│       │   │   ├── encryption.service.ts
│       │   │   ├── export.service.ts
│       │   │   └── upload.service.ts
│       │   │
│       │   └── utils/
│       │       ├── orderNumberGenerator.ts
│       │       ├── permissionResolver.ts
│       │       ├── pasteParser.ts
│       │       ├── responseHelpers.ts
│       │       └── validators.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       │
│       ├── tests/
│       │   ├── auth.test.ts
│       │   ├── orders.test.ts
│       │   ├── permissions.test.ts
│       │   ├── encryption.test.ts
│       │   ├── pasteParser.test.ts
│       │   └── helpers/
│       │       └── testSetup.ts
│       │
│       ├── uploads/
│       ├── .env.example
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   │   ├── order.ts
│       │   │   ├── user.ts
│       │   │   ├── status.ts
│       │   │   ├── field.ts
│       │   │   ├── permission.ts
│       │   │   ├── payroll.ts
│       │   │   └── fb-account.ts
│       │   ├── schemas/
│       │   │   ├── auth.schema.ts
│       │   │   ├── order.schema.ts
│       │   │   ├── user.schema.ts
│       │   │   ├── status.schema.ts
│       │   │   ├── field.schema.ts
│       │   │   └── settings.schema.ts
│       │   └── constants/
│       │       ├── permissions.ts
│       │       ├── defaultStatuses.ts
│       │       └── fieldTypes.ts
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── turbo.json
├── .gitignore
├── .env.example
└── README.md
```

---

## SECTION 7: API ENDPOINT REFERENCE

```
AUTH
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/me/password
PUT    /api/auth/me/profile

ORDERS
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id
POST   /api/orders/bulk-delete
PUT    /api/orders/bulk-status
POST   /api/orders/:id/attachments
DELETE /api/orders/:id/attachments/:attachId
GET    /api/orders/:id/audit-log
POST   /api/orders/parse-paste

STATUSES
GET    /api/statuses
POST   /api/statuses
PUT    /api/statuses/:id
DELETE /api/statuses/:id
PUT    /api/statuses/reorder

FIELDS
GET    /api/fields
POST   /api/fields
PUT    /api/fields/:id
DELETE /api/fields/:id
PUT    /api/fields/reorder

USERS
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/suspend
POST   /api/users/:id/unsuspend
POST   /api/users/:id/force-logout
GET    /api/users/:id/effective-permissions
POST   /api/users/:id/assign-policy
DELETE /api/users/:id/policies/:policyId
POST   /api/users/:id/assign-group
DELETE /api/users/:id/groups/:groupId

GROUPS
GET    /api/groups
POST   /api/groups
PUT    /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/members
DELETE /api/groups/:id/members/:userId
POST   /api/groups/:id/policies
DELETE /api/groups/:id/policies/:policyId

POLICIES
GET    /api/policies
POST   /api/policies
GET    /api/policies/:id
PUT    /api/policies/:id
DELETE /api/policies/:id

PERMISSIONS
GET    /api/permissions

NOTIFICATIONS
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id

ANNOUNCEMENTS
GET    /api/announcements
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id

SETTINGS
GET    /api/settings
PUT    /api/settings

SEARCH
GET    /api/search?q=...&scope=all|orders|users

EXPORT
POST   /api/export/orders
POST   /api/export/payroll-summary
POST   /api/export/salary-slip/:employeeId/:periodId

AUDIT
GET    /api/audit

PAYROLL
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
GET    /api/payroll-periods
POST   /api/payroll-periods
GET    /api/payroll-periods/:id
PUT    /api/payroll-periods/:id
GET    /api/advances
POST   /api/advances
DELETE /api/advances/:id

FB ACCOUNTS
GET    /api/fb-accounts
POST   /api/fb-accounts
GET    /api/fb-accounts/:id
PUT    /api/fb-accounts/:id
DELETE /api/fb-accounts/:id
POST   /api/fb-accounts/:id/reveal-vault
GET    /api/fb-accounts/:id/status-log
```

---

## SECTION 8: ENVIRONMENT VARIABLES

```bash
# apps/api/.env

NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-nexacrm.vercel.app

DATABASE_URL=postgresql://user:pass@host:5432/nexacrm

REDIS_URL=redis://default:pass@host:port

JWT_ACCESS_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

ENCRYPTION_KEY=<32-byte hex string>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=NexaCRM <noreply@nexacrm.com>

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=nexacrm-uploads
R2_PUBLIC_URL=

SUPER_ADMIN_EMAIL=admin@company.com
SUPER_ADMIN_PASSWORD=<strong-initial-password>
SUPER_ADMIN_NAME=System Admin
```

---

## SECTION 9: BUILD ORDER

Build in this exact sequence. Do not skip ahead. Do not start a new phase before the previous one is verified working. Commit after every step.

---

### PHASE 1 — Scaffold & Infrastructure
**Goal: Everything runs locally. Database connects. Repo is on GitHub.**

- Step 1: Initialize Turborepo monorepo, create `apps/web`, `apps/api`, `packages/shared`. Push initial commit to GitHub.
- Step 2: Set up `packages/shared` — all TypeScript types, Zod schemas, permission name constants, default status definitions.
- Step 3: Set up `apps/api` — Express + TypeScript + Prisma. Config layer: env validation (Zod, crash on missing vars), database singleton, Redis client, Winston logger.
- Step 4: Write complete `prisma/schema.prisma` from Section 5. Run initial migration. Write idempotent `seed.ts` (SUPER_ADMIN user, default statuses: Confirmed/Delivered/Rescheduled/Cancelled/Returned, all standard fields, all permissions).
- Step 5: Set up `apps/web` — Vite + React + TypeScript + Tailwind + shadcn/ui. Install all frontend dependencies. Verify dev server starts.
- Step 6: Docker Compose for local dev (PostgreSQL + Redis). Verify full stack starts with `docker-compose up`.

**Phase 1 complete when:** `docker-compose up` starts everything, `prisma migrate deploy` + `prisma db seed` runs without errors, both dev servers start.

---

### PHASE 2 — Authentication & Session Management
**Goal: Login works. Tokens work. Sessions work. Protected routes work.**

- Step 7: Auth service — login (argon2 verify, token generation), logout (revoke refresh token), refresh token rotation with family tracking, forgot password, reset password.
- Step 8: Auth routes and controllers.
- Step 9: Middleware — `authenticate.ts` (JWT verify + blacklist check), `authorize.ts` (permission factory), `rateLimiter.ts`, `errorHandler.ts`, `requestLogger.ts`, `validateBody.ts`, `auditLogger.ts`.
- Step 10: Frontend — Axios instance with JWT interceptor and silent refresh token rotation on 401. Zustand authStore. ProtectedRoute component. Login page. Token stored in memory (access) and HttpOnly cookie (refresh).

**Phase 2 complete when:** Login returns tokens, refresh rotation works, a protected route returns 401 without token and 200 with token, brute force lockout triggers after 5 failures.

---

### PHASE 3 — IAM System (Users, Groups, Policies, Permissions)
**Goal: Full AWS IAM-equivalent system works end to end.**

- Step 11: Permissions service — resolve effective permissions for a user (flatten individual policies + group policies into string array). Cache result in Redis with 5-minute TTL. Invalidate cache when user's permissions change.
- Step 12: Users CRUD — create, read, update, soft-delete, suspend/unsuspend, force-logout (invalidate all Redis sessions), view effective permissions.
- Step 13: Policies CRUD — create, read, update, delete. Attach permissions to policy. Propagate changes to all attached users/groups immediately (invalidate their Redis permission cache).
- Step 14: Groups CRUD — create, read, update, delete. Add/remove members. Attach/detach policies.
- Step 15: Temporary permission assignments — create with expiry, background job (Bull) that runs every 5 minutes to revoke expired assignments and invalidate affected users' permission cache.
- Step 16: Frontend — Admin panel pages for Users, Groups, Policies. Effective Permissions viewer. Create/Edit modals for all three.

**Phase 3 complete when:** Creating a group, adding a policy to it, and adding a user to that group results in the user having those permissions resolved correctly. Temporary assignment expires and access is revoked automatically.

---

### PHASE 4 — Orders Core
**Goal: Orders can be created, read, updated, deleted. Statuses work. Fields work.**

- Step 17: Statuses CRUD — create, read, update, archive, reorder. Enforce: archiving a non-empty status shows count warning.
- Step 18: Fields CRUD — create, read, update, delete, reorder. Enforce: only Admin can make a field required. Soft-delete with warning if orders have data in that field.
- Step 19: Orders service — create (auto-generate order number NX-YYYY-NNNNN using per-year sequence), read with all filters (status, date range, created by, search, pagination), update (enforce edit window), soft-delete, bulk operations.
- Step 20: Order audit log — automatically record every field change on every update in `order_audit_log`.
- Step 21: File attachments — Multer middleware, upload to local disk (swappable to R2), serve via API route, delete.
- Step 22: Smart paste parser endpoint — `/api/orders/parse-paste`. See Section 11 for algorithm.
- Step 23: Frontend — Orders Table View with TanStack Table (sort, filter per column, global search with arrow key navigation, date range filter, status filter, bulk select). Order detail slide-in panel with audit log. Create/Edit order modals with DynamicFieldRenderer. Kanban View with dnd-kit. Calendar View.

**Phase 4 complete when:** Full order lifecycle works (create → view → edit → status change → delete → soft-delete recovery). Smart paste correctly maps fields. Edit window enforces correctly. Bulk export produces correct Excel/PDF/CSV output.

---

### PHASE 5 — Dashboard & Notifications
**Goal: Dashboards are role-aware. Notifications work. Announcements work.**

- Step 24: Notifications service — create notification records, mark as read, fetch unread count. Email notifications via Nodemailer triggered on order status change and key system events.
- Step 25: Announcements CRUD — Admin creates/edits/archives. All users see active announcements.
- Step 26: Admin dashboard — Since You Were Gone banner, New Entries Since Last Login widget, all KPI cards, orders by status chart, orders trend chart, top performer, today's deliveries, recent activity feed, announcements manager.
- Step 27: User dashboard — Since You Were Gone banner (own orders scope), Quick Add Order button, own KPI cards, My Recent Orders widget, today's deliveries (system-wide), active announcements.
- Step 28: Frontend — Notification bell in topbar with live unread count. Notification dropdown. Mark as read interactions.

**Phase 5 complete when:** Admin logs in after orders were created while logged out and sees them in the Since You Were Gone section. User logs in and sees their own changed orders. Notifications appear in bell and via email.

---

### PHASE 6 — Settings & Global Search
**Goal: Admin can configure everything through GUI. Global search works.**

- Step 29: Settings service — read and batch-update key-value settings. Settings applied system-wide on change (timezone, edit window, session timeout, module toggles).
- Step 30: Settings frontend — all tabs: General, Fields, Statuses, Appearance, Notifications, Module Toggles. Every setting persists and takes effect without page reload where possible.
- Step 31: Global search — backend endpoint searches across orders, users, statuses, announcements. Frontend Cmd+K modal with keyboard navigation.
- Step 32: Profile page — user edits own name, email, password, theme preference.

**Phase 6 complete when:** Admin changes edit window from 30 to 60 minutes and it takes effect immediately for new orders. Toggling payroll module off removes it from the sidebar for all users. Global search returns results across all entity types.

---

### PHASE 7 — Payroll & Facebook Accounts Modules
**Goal: Both modules fully functional. Correctly gated behind module toggles.**

- Step 33: Payroll — employees CRUD, payroll periods CRUD, advances CRUD, payroll dashboard with charts, PDF salary slip export, Excel summary export.
- Step 34: Facebook Accounts — accounts CRUD, status history log, vault note (AES-256 encrypt on save, decrypt on explicit reveal with password confirmation), status log on every status change.
- Step 35: Frontend — all pages for both modules. Both correctly hidden when their module toggle is OFF.

**Phase 7 complete when:** Payroll module is off by default. Admin turns it on in Settings and it appears in sidebar. Salary slip exports correctly. Vault note encrypts and only decrypts on password confirmation.

---

### PHASE 8 — Polish, Security Hardening & QA
**Goal: Production-ready. No rough edges. No security gaps.**

- Step 36: Security pass — Helmet.js with strict CSP, CORS locked to production domain only, all inputs sanitized with DOMPurify (rich text) and express-validator (all API inputs), verify no raw SQL anywhere (all Prisma), verify no secrets in code.
- Step 37: UI polish — loading skeletons on all async views, empty states on all tables and lists, error boundaries on all pages, confirm dialogs on all destructive actions, responsive layout verified on 768px (tablet) and 375px (mobile).
- Step 38: Keyboard navigation — Tab order correct everywhere, Enter submits forms, Escape closes modals/panels, Cmd+K triggers search, arrow keys navigate search results.
- Step 39: Light/Dark mode — verify every component renders correctly in both modes. No hardcoded colors anywhere.
- Step 40: Performance — verify TanStack Table virtualizes correctly on 1000+ rows, verify API pagination works, verify Redis caching reduces DB load.

**QA Gate — must pass before Phase 9:**
- Create 10 orders as a USER. Verify edit window enforces correctly.
- Log in as ADMIN. Verify Since You Were Gone shows all 10 orders.
- Create a group, add a policy, add a user to the group. Verify effective permissions resolve correctly.
- Test bulk export (Excel, PDF, CSV) on 100 orders.
- Test smart paste with a realistic WhatsApp message format.
- Suspend a user and verify they cannot log in.
- Force-logout a user and verify their existing session is invalidated.
- Toggle payroll module on and off and verify sidebar updates.
- Attempt SQL injection in order search field. Verify it is harmless.
- Attempt XSS in a notes field. Verify it is escaped.
- Attempt to access an admin route with a USER token. Verify 403.
- Attempt to edit another user's order as a USER. Verify 403.
- Attempt to use an expired temporary permission. Verify it is rejected.

---

### PHASE 9 — Testing & CI/CD
**Goal: Automated tests pass. Deployment pipeline works. Software is live.**

- Step 41: Unit tests — `auth.service.ts` (login, token rotation, lockout), `permissions.service.ts` (effective permission resolution), `pasteParser.ts` (field mapping, edge cases), `encryption.service.ts` (encrypt/decrypt round trip), `orderNumberGenerator.ts` (sequence correctness).
- Step 42: Integration tests — auth routes (login, refresh, logout, rate limiting), orders routes (create, read, update, delete, bulk operations, edit window enforcement), permissions middleware (valid token, expired token, missing permission).
- Step 43: GitHub Actions CI — on every push to main: install, typecheck, run all tests. Block merge if any fail.
- Step 44: GitHub Actions Deploy — on merge to main: deploy frontend to Vercel, deploy backend to Railway/Render.
- Step 45: Production database setup — configure Supabase PostgreSQL, run `prisma migrate deploy`, run seed. Configure Upstash Redis. Configure Cloudflare R2.
- Step 46: Set all production environment variables on hosting platforms.
- Step 47: Smoke test production — login as super admin, create an order, change its status, export it, check dashboard widgets, verify notifications fire, verify payroll module toggles.
- Step 48: Delete HANDOVER.md, commit, push.

**Phase 9 complete when:** All tests pass in CI. Software is live at production URL. Smoke test passes. HANDOVER.md is deleted from the repository.

---

## SECTION 10: UI/UX DESIGN

**Typography:**
- All text: Inter (variable weight)
- Monospace / codes / IDs: JetBrains Mono

**Color Palette:**

| Token | Light | Dark |
|---|---|---|
| Background | `#F8F9FA` | `#0F1117` |
| Surface | `#FFFFFF` | `#1A1D27` |
| Border | `#E2E8F0` | `#2D3148` |
| Primary | `#4F46E5` | `#6366F1` |
| Success | `#10B981` | `#10B981` |
| Warning | `#F59E0B` | `#F59E0B` |
| Danger | `#EF4444` | `#EF4444` |
| Text primary | `#0F172A` | `#F1F5F9` |
| Text secondary | `#64748B` | `#94A3B8` |

Primary color is configurable in Settings and stored in the database. When changed, it applies to all users immediately.

**Design Principles:**
- Dense information display — this is a CRM used by warehouse staff, not a marketing site. Users want data visible, not whitespace.
- Table rows show action buttons (edit, delete, copy) on hover only — keeps the view clean at rest.
- Order detail opens as a right slide-in panel, not a full page — preserves table context.
- Status badges are always colored, always consistent across the entire UI.
- Animations: 150ms ease on hover and focus transitions only. No animations that delay interactions.
- Destructive bulk actions require typed confirmation ("type DELETE to confirm").
- Keyboard-first: Tab navigation, Enter to submit, Escape to close, Cmd/Ctrl+K for search.
- Sticky table headers on vertical scroll.
- Sidebar is collapsible (icon-only mode) for more table real estate.

---

## SECTION 11: SMART PASTE PARSER

This is a core feature. It must work reliably for real WhatsApp/Facebook message formats.

**Example input:**
```
Name: John Smith
Phone: +1 (416) 555-0123
Address: 123 Main St, Toronto ON M5V 2T6
Product: Queen Mattress + Box Spring
Price: $450
Status: Confirmed
Delivery: Dec 20
```

**Algorithm (runs server-side at `/api/orders/parse-paste`):**

1. Split input text by newlines
2. For each line, attempt to split on `:` (first occurrence only) or ` - ` delimiter
3. Left side = candidate field name (trim whitespace, lowercase)
4. Right side = candidate value (trim whitespace)
5. Fuzzy match candidate field name against all known field labels using: exact match first, then contains match, then Levenshtein distance ≤ 2
6. If match found → add to mapped fields object: `{ fieldId: value }`
7. If no match found → add to unknown fields array: `{ candidateName, candidateValue }`
8. Return both mapped fields and unknown fields to frontend
9. Frontend pre-fills the order form with mapped fields
10. Frontend shows unknown fields as a list: "We found '[X]' — add as new field?" (checkbox each)
11. User checks which unknowns to add as new fields, confirms, order is created

**Edge cases to handle:**
- Lines with no delimiter → treat entire line as a freeform note, append to Notes field
- Multiple matches for same field → return both options, user selects in frontend
- Date values → parse with date-fns `parseDate`, try multiple formats (Dec 20, 12/20, 2024-12-20), normalize to ISO 8601
- Phone numbers → strip all non-digit characters, prepend +1 if 10 digits remain
- Currency values → strip `$`, `,`, spaces; parse as float; store as number
- Empty values (line like `Phone:`) → skip that field

---

## SECTION 12: IMPLEMENTATION NOTES

1. **Never store secrets in code.** Every secret in `.env`. Validate all env vars with Zod on startup — if any are missing, the server must refuse to start with a clear error message listing what is missing.

2. **Prisma migrations only.** Never modify the database directly. Every schema change goes through `prisma migrate dev` in development and `prisma migrate deploy` in production.

3. **Soft deletes everywhere.** Orders, users, statuses all have a `deletedAt` field. Add Prisma middleware that automatically filters `deletedAt: null` on all find queries. Hard deletion requires explicit Admin action with confirmation.

4. **Edit window enforcement.** On every order update request: compute `order.createdAt + settings.editWindowMinutes`. If `now()` is past that time and the requesting user is not ADMIN or SUPER_ADMIN, return HTTP 403 with code `EDIT_WINDOW_EXPIRED`.

5. **Effective permissions caching.** On successful login: resolve user's effective permissions (query individual policies + all group policies, flatten to `string[]`), store in Redis as `permissions:{userId}` with 5-minute TTL. On every permission change (policy update, group change, suspension), immediately delete the affected user's Redis key so it is recomputed on next request.

6. **Dynamic fields via JSONB.** `orders.custom_fields` is a JSONB column. Keys are field UUIDs, values are the field values as strings. Field metadata (label, type, required, options) lives in the `fields` table. This allows unlimited custom fields with zero schema migrations.

7. **Paste parser runs server-side only.** Never run field fuzzy matching client-side. The field list and IDs must not be exposed to unauthenticated or unauthorized clients.

8. **Large exports are server-side.** Client-side jsPDF is acceptable for single-order PDF. For bulk exports (hundreds or thousands of rows), use ExcelJS (backend) and PDFKit (backend) to generate the file server-side and stream it to the client. This prevents browser crashes on large datasets.

9. **Seeding is idempotent.** `prisma db seed` must be safe to run multiple times. Use `upsert` on every record in seed.ts. Running it twice must not create duplicates.

10. **Module toggles.** `settings` table stores `module.payroll.enabled` and `module.fb_accounts.enabled` as string `"true"` or `"false"`. Backend routes exist regardless of toggle — the toggle only controls frontend navigation visibility. Admin toggles via GUI; zero redeploy required.

11. **File storage is swappable.** `upload.service.ts` abstracts all file operations behind an interface. Local disk implementation is used in development. Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) is used in production. Swapping is a config change in the service, not a route change.

12. **Standard API response shape:**
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "total": 245, "limit": 50 }
}
```
Error shape:
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to edit this order."
  }
}
```
Every route handler must return one of these two shapes. No raw Express error objects ever reach the client.

13. **Order number generation.** Format: `NX-YYYY-NNNNN` where NNNNN is zero-padded and increments per calendar year. Use the `order_sequences` table with an upsert + increment in a database transaction to prevent race conditions when multiple orders are created simultaneously.

14. **Timezone handling.** All dates and timestamps are stored in UTC. The frontend loads the company's configured timezone from settings on app start and applies it to all date display using `date-fns-tz`. Never store or display dates in local browser timezone.

15. **Dark mode implementation.** Use Tailwind's `class` strategy. The `dark` class on the `<html>` element activates dark mode. User preference is stored in the database (`users` table or settings) and also in `localStorage` for instant application on page load before the API call completes. On first visit with no stored preference, use `window.matchMedia('(prefers-color-scheme: dark)')`.

16. **Last login tracking for Since You Were Gone.** The `users` table has two timestamp columns: `last_login` and `previous_login`. On every successful login: first copy the current `last_login` value into `previous_login`, then set `last_login` to `now()`. Return `previous_login` to the frontend as `previousLoginAt` in the `/api/auth/me` response. The frontend stores this in authStore and uses it as the `createdAfter` filter for the dashboard catch-up queries. This gives an accurate picture of exactly what happened between the user's last session and this one.

17. **Background job for temporary permission expiry.** Use Bull queue with a repeating job every 5 minutes. The job queries `user_policies` where `expires_at < now()` and `is_active = true`, sets them to `is_active = false`, and deletes their Redis permission cache key. This ensures temporary permissions are revoked promptly without requiring a request to trigger the check.

18. **Error boundaries.** Every top-level page component must be wrapped in an `ErrorBoundary` component that catches render errors and shows a "Something went wrong" UI with a reload button, instead of a white screen. The error is logged to the console and optionally sent to the monitoring service.


---

## SECTION 13: README.md SPECIFICATION

The root `README.md` must be written during Phase 1 Step 1 and kept accurate throughout. It serves as the first thing any developer or agent reads when opening the repository cold.

Required sections in README.md:

```markdown
# NexaCRM

Internal CRM for sales and order management. Built with React, Express, PostgreSQL, Redis.

## Prerequisites
- Node.js 20 LTS
- Docker and Docker Compose (for local PostgreSQL and Redis)
- A GitHub account (for CI/CD)

## Local Development Setup

1. Clone the repository
2. Copy `.env.example` to `apps/api/.env` and fill in all values
3. Start the database and Redis: `docker-compose up -d`
4. Install dependencies: `npm install` (from root)
5. Run database migrations: `cd apps/api && npx prisma migrate dev`
6. Seed the database: `cd apps/api && npx prisma db seed`
7. Start all services: `npm run dev` (from root, runs both frontend and backend via Turborepo)
8. Frontend: http://localhost:5173
9. Backend: http://localhost:3001
10. Default super admin login: see SUPER_ADMIN_EMAIL in your .env

## Project Structure
[Brief description of monorepo layout — apps/web, apps/api, packages/shared]

## Environment Variables
See `apps/api/.env.example` for all required variables with descriptions.

## Running Tests
`npm run test` from root runs all tests across the monorepo.

## Deployment
Frontend deploys automatically to Vercel on push to main.
Backend deploys automatically to Railway/Render on push to main.
See `.github/workflows/` for CI/CD pipeline details.

## Build Status
[GitHub Actions badge — add after CI is configured]
```

---

## SECTION 14: CI/CD PIPELINE SPECIFICATION

### `.github/workflows/ci.yml`

Runs on every push and pull request to `main`. Must pass before any merge.

Steps:
1. Checkout code
2. Set up Node.js 20
3. Install dependencies (`npm ci` from root)
4. TypeScript typecheck — `npm run typecheck` (both `apps/web` and `apps/api`)
5. Run all tests — `npm run test` (both `apps/api` Jest tests)
6. Build frontend — `npm run build` in `apps/web` (catches build-time errors)

The CI workflow must NOT deploy anything. Deployment is separate.

### `.github/workflows/deploy.yml`

Runs only on push to `main` after CI passes.

Steps:
1. Deploy frontend — Vercel CLI (`vercel --prod`) or use Vercel's native GitHub integration (preferred — zero config after initial link)
2. Deploy backend — trigger Railway/Render deploy hook via `curl` to the deploy webhook URL stored as a GitHub Actions secret
3. Run production migrations — `npx prisma migrate deploy` via SSH or Railway's run command feature

Required GitHub Actions secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_DEPLOY_WEBHOOK` (or equivalent for Render)
- All production env vars needed by the migration step

---

## SECTION 15: WHAT THE FIRST AGENT MUST DO IN THE FIRST 10 MINUTES

This is a checklist for the very first session, before any code is written:

1. Read this entire blueprint document.
2. Create the GitHub repository named `nexacrm` (public or private — does not matter).
3. Initialize the monorepo locally with Turborepo scaffold.
4. Create the root `.gitignore`.
5. Create the root `README.md` (draft — can be fleshed out later, but must exist).
6. Create the initial `HANDOVER.md` with:
   - Last Updated: now
   - What Was Just Completed: "Project initialized. Empty monorepo scaffold created."
   - Current Project State: "Empty repository. No code written yet."
   - What Is Next: "Phase 1, Step 2 — set up packages/shared with all TypeScript types and Zod schemas."
   - Known Issues: "None."
   - Environment Notes: "Nothing configured yet. See .env.example once created."
   - How to Resume: "Clone repo, read HANDOVER.md, read blueprint, proceed to next step."
7. Push everything to GitHub.
8. Begin Phase 1, Step 2.

This sequence ensures the repository exists and is reachable from the very first commit, so no work is ever done locally without a remote backup.

---

## SECTION 16: MODEL-SWITCHING CHECKLIST

When the current agent is running low on context or session capacity, it must do the following before stopping:

1. Commit all current work — even if a step is not fully complete, commit what exists with a clear message noting it is incomplete.
2. Write a thorough HANDOVER.md — be extremely specific about what is half-done. Name the specific file, the specific function, the specific line if needed. Vague handovers cause the next agent to redo work or break things.
3. Push to GitHub.
4. Stop.

The next agent must:
1. Pull the latest code from GitHub.
2. Read HANDOVER.md in full.
3. Read the relevant section of this blueprint for the current phase.
4. Reproduce the dev environment using the "How to Resume" commands.
5. Verify the environment starts without errors.
6. Continue from exactly where HANDOVER.md says to continue — not from the beginning, not from a guess.

Do not assume. Do not rewrite things that already exist. Read the code that is already there before touching anything.
