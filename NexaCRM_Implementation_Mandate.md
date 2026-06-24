# NexaCRM — Implementation Mandate v1.0
## Complete Feature Changes & Bug Fixes

---

## CRITICAL RULES — READ BEFORE TOUCHING ANY CODE

1. **This project is live and deployed.** Frontend is on Vercel (React/Vite, `apps/web`). Backend is on Railway (Express, `apps/api`). Database is Supabase (PostgreSQL via Prisma). Any change that breaks the build pipeline, TypeScript compilation, Prisma schema sync, or CORS will break the production app.

2. **Commit after every completed feature.** Not after every file edit — after every complete, working, tested feature. Message format: `[FEATURE] Short description of what was done`.

3. **Never break what is already working.** Before touching any file, read it fully first. Do not delete or rename anything without confirming it is unused. Do not change shared types in `packages/shared` without verifying both `apps/api` and `apps/web` still compile.

4. **No TypeScript errors allowed.** The Vercel build runs `tsc -b` before `vite build`. Any TypeScript error will fail the deployment. Run `npm run typecheck --workspace=apps/web` and `npm run typecheck --workspace=apps/api` after every change and fix all errors before committing.

5. **Database migrations must be safe.** Every Prisma schema change must be accompanied by a migration file. Never use `prisma db push` on production — always use `prisma migrate dev` locally, commit the migration, and let Railway run `prisma migrate deploy` on startup. Never drop columns with data. Add new columns with defaults or as nullable.

6. **Follow the SDLC for each feature:**
   - Read existing code first
   - Plan the change (backend schema → API → frontend)
   - Implement backend first, test the API manually or via existing tests
   - Implement frontend second
   - Run typechecks
   - Commit

7. **Do not introduce new dependencies** without a strong reason. If a new npm package is needed, install it in the correct workspace (`apps/api` or `apps/web`), not the root.

8. **Environment variables are already set** on Railway (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, etc.) and Vercel (`VITE_API_URL`). Do not hardcode any URLs or secrets.

---

## FEATURE 1 — Announcement Lifecycle & Visibility

### What is broken / needed
- Announcements added by admin/super admin appear in the notification tab but NOT in the Announcements tab of the super admin portal.
- Once a notification for an announcement is marked as read, the announcement cannot be viewed again anywhere.
- Announcements live forever with no expiry — this causes clutter.
- New users created after an announcement was posted cannot see that day's announcements.

### Required Behaviour
- Announcements must have a configurable lifecycle (default: 30 days). After expiry, they are automatically hidden from all views.
- The Announcements tab must always show all active, non-expired announcements regardless of notification read status — these are two separate systems.
- New users must be able to see all announcements that were created on the same calendar day they were created as a user, but not older ones.
- Admins and super admins can see all announcements (active and inactive, expired and unexpired) in the management tab.

### Backend Changes

**Step 1 — Prisma Schema (`apps/api/prisma/schema.prisma`)**

Add `expiresAt` field to the `Announcement` model:

```prisma
model Announcement {
  id        String    @id @default(uuid()) @db.Uuid
  title     String    @db.VarChar
  content   String    @db.Text
  isActive  Boolean   @default(true) @map("is_active")
  expiresAt DateTime? @map("expires_at") @db.Timestamptz   // ADD THIS
  createdBy String?   @map("created_by") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  creator User? @relation(fields: [createdBy], references: [id])

  @@map("announcements")
}
```

Create the migration: `npx prisma migrate dev --name add_announcement_expires_at`

**Step 2 — Announcements Service (`apps/api/src/services/announcements.service.ts`)**

Update `getAllAnnouncements` to accept a `userId` and `userCreatedAt` parameter for new-user visibility logic, and to filter by expiry:

```typescript
async getAllAnnouncements(options: {
  onlyActive?: boolean;
  includeExpired?: boolean;
  userId?: string;
  userCreatedAt?: Date;
} = {}) {
  const { onlyActive = false, includeExpired = false, userCreatedAt } = options;

  const where: any = {};

  if (onlyActive) where.isActive = true;

  if (!includeExpired) {
    // Exclude expired announcements (expiresAt is in the past)
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];
  }

  // New user visibility: only show announcements from the same calendar day as userCreatedAt onwards
  // This means announcements created on or after the start of the user's creation day
  if (userCreatedAt) {
    const startOfUserCreationDay = new Date(userCreatedAt);
    startOfUserCreationDay.setHours(0, 0, 0, 0);
    where.createdAt = { gte: startOfUserCreationDay };
  }

  return prisma.announcement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true } },
    },
  });
}
```

Update `createAnnouncement` to accept and store `expiresAt`:

```typescript
async createAnnouncement(data: CreateAnnouncementInput & { expiresAt?: Date }, userId: string) {
  const defaultExpiryDays = 30;
  const expiresAt = data.expiresAt ?? new Date(Date.now() + defaultExpiryDays * 24 * 60 * 60 * 1000);

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      content: DOMPurify.sanitize(data.content),
      isActive: data.isActive ?? true,
      expiresAt,
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, name: true } },
    },
  });
  // ... rest of notification logic unchanged
  return announcement;
}
```

**Step 3 — Announcements Controller (`apps/api/src/controllers/announcements.controller.ts`)**

In the `getAll` handler, pass the current user's role and `createdAt` to the service:

```typescript
static async getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = (req as any).user;
    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    const announcements = await announcementsService.getAllAnnouncements({
      onlyActive: !isAdminOrSuper,
      includeExpired: isAdminOrSuper,
      // For regular users and admins who are not super admin, apply new-user date filter
      userCreatedAt: isAdminOrSuper ? undefined : new Date(currentUser.createdAt),
    });

    return sendSuccess(res, announcements);
  } catch (error) {
    next(error);
  }
}
```

### Frontend Changes

**Announcements Page (`apps/web/src/pages/admin/AnnouncementsPage.tsx`)**

- The page already fetches from `/announcements` — no URL change needed.
- Add a column or badge showing expiry date in the announcement list.
- In the "Create Announcement" form, add an optional "Expires At" date picker (defaults to 30 days from now, but admin can change it).
- Show a visual indicator (e.g., greyed out row, "Expired" badge) for expired announcements when viewed by admin/super admin.

**Notification System — NO CHANGE NEEDED**

The notifications tab is a separate system. Marking a notification as read only affects the notification record. The announcement itself remains visible in the announcements tab as long as it is active and not expired. These are already separate data models — do not link their read/unread state.

---

## FEATURE 2 — User-Level Appearance Settings (Non-Global)

### What is broken / needed
- Settings in the Appearance tab (theme, colors, display preferences) are currently global — changing them affects everyone.
- They must be per-user. Each user, admin, and super admin has their own appearance preferences that do not affect others.

### Backend Changes

**Step 1 — Add `UserSetting` model to Prisma schema**

```prisma
model UserSetting {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  key       String   @db.VarChar
  value     String   @db.Text
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@map("user_settings")
}
```

Add the relation to the User model:
```prisma
  userSettings  UserSetting[]
```

Create migration: `npx prisma migrate dev --name add_user_settings`

**Step 2 — New User Settings Service (`apps/api/src/services/userSettings.service.ts`)**

```typescript
import prisma from '../config/database';

export class UserSettingsService {
  static async getSetting(userId: string, key: string, defaultValue = '') {
    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId, key } }
    });
    return setting?.value ?? defaultValue;
  }

  static async getSettings(userId: string): Promise<Record<string, string>> {
    const settings = await prisma.userSetting.findMany({ where: { userId } });
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
  }

  static async setSetting(userId: string, key: string, value: string) {
    return prisma.userSetting.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, value },
      update: { value },
    });
  }

  static async setSettings(userId: string, settings: Record<string, string>) {
    const ops = Object.entries(settings).map(([key, value]) =>
      prisma.userSetting.upsert({
        where: { userId_key: { userId, key } },
        create: { userId, key, value },
        update: { value },
      })
    );
    return prisma.$transaction(ops);
  }
}
```

**Step 3 — New Routes (`apps/api/src/routes/userSettings.routes.ts`)**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { UserSettingsService } = await import('../services/userSettings.service');
    const settings = await UserSettingsService.getSettings(userId);
    res.json({ success: true, data: settings });
  } catch (e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { UserSettingsService } = await import('../services/userSettings.service');
    await UserSettingsService.setSettings(userId, req.body);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
```

Register in `apps/api/src/app.ts`:
```typescript
import userSettingsRouter from './routes/userSettings.routes';
app.use('/api/user-settings', userSettingsRouter);
```

### Frontend Changes

**Appearance Settings Tab (`apps/web/src/pages/admin/settings/tabs/AppearanceSettings.tsx`)**

- Change all GET and PUT calls from `/settings` (global) to `/user-settings` (per-user).
- On component mount, load from `/user-settings`.
- On save, PUT to `/user-settings`.
- Apply the loaded settings only for the current user's session — store them in a local Zustand store or React context, not in a global singleton that gets shared.
- Make sure the appearance settings (theme colors, font, display density, etc.) are applied from the per-user store when the app loads, not from a global settings fetch.

**Important:** The global `/settings` endpoint must remain unchanged for other settings tabs (notifications, statuses, fields, etc.). Only the Appearance tab switches to `/user-settings`.

---

## FEATURE 3 — User Permission: View Only Own Orders (Default)

### What is needed
- By default, regular users (`role === 'USER'`) should only see orders they personally created.
- This must be a permission (`orders:view_all`) that admins can grant to specific users.
- If a user does NOT have `orders:view_all`, they only see `WHERE createdBy = currentUserId`.
- Admins and super admins always see all orders.
- This must be the default — new users created without this permission should automatically be restricted.

### Backend Changes

**Step 1 — Seed the new permission**

In `apps/api/prisma/seed.ts` (or wherever seeds live), add:

```typescript
await prisma.permission.upsert({
  where: { name: 'orders:view_all' },
  create: {
    name: 'orders:view_all',
    description: 'Can view all orders, not just own',
    module: 'orders',
  },
  update: {},
});
```

Run the seed after adding: `npx prisma db seed`

**Step 2 — Orders Service (`apps/api/src/services/orders.service.ts`)**

Update `getOrders` to accept a `viewingUserId` and `canViewAll` flag:

```typescript
static async getOrders(params?: {
  statusId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  viewingUserId?: string;   // ADD
  canViewAll?: boolean;     // ADD
}) {
  const where: any = { deletedAt: null };

  // Restrict to own orders if user doesn't have view_all permission
  if (params?.viewingUserId && !params?.canViewAll) {
    where.createdBy = params.viewingUserId;
  }

  // ... rest of existing filter logic unchanged
}
```

**Step 3 — Orders Controller (`apps/api/src/controllers/orders.controller.ts`)**

In the `getAll` handler, check the permission and pass it to the service:

```typescript
static async getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = (req as any).user;
    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    let canViewAll = isAdminOrSuper;
    if (!isAdminOrSuper) {
      const permissions = await PermissionsService.getEffectivePermissions(currentUser.id);
      canViewAll = permissions.includes('orders:view_all');
    }

    const orders = await OrdersService.getOrders({
      ...req.query,
      viewingUserId: currentUser.id,
      canViewAll,
    });

    return sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
}
```

### Frontend Changes

No frontend change needed — the filter is enforced on the backend. The orders list will automatically show only the appropriate orders. Do not add any frontend filter that checks role — the backend is the single source of truth.

---

## FEATURE 4 — User Permission: Cannot Set/Edit Order Status (Default)

### What is needed
- By default, regular users cannot set or change the status of an order.
- When a user creates an order, the status field must be automatically set to a special "Undecided" status (or the system's default status if one is marked `isDefault = true`).
- Users cannot change the status after creation unless they have the `orders:manage_status` permission.
- If an admin has already set a status on an order, users cannot change it.
- Only admins and super admins can assign/change statuses on any order.
- Admins can grant `orders:manage_status` permission to specific users.

### Backend Changes

**Step 1 — Seed the new permission**

```typescript
await prisma.permission.upsert({
  where: { name: 'orders:manage_status' },
  create: {
    name: 'orders:manage_status',
    description: 'Can set and change order statuses',
    module: 'orders',
  },
  update: {},
});
```

**Step 2 — Ensure a default "Undecided" status exists in the seed**

```typescript
await prisma.status.upsert({
  where: { name: 'Undecided' }, // adjust based on your unique constraint
  create: {
    name: 'Undecided',
    color: '#94a3b8',
    isDefault: true,
    position: 0,
  },
  update: { isDefault: true },
});
```

**Step 3 — Orders Controller: Enforce on Create**

In the `createOrder` handler:

```typescript
static async createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = (req as any).user;
    const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    let { statusId, deliveryDate, customFields, notes } = req.body;

    if (!isAdminOrSuper) {
      const permissions = await PermissionsService.getEffectivePermissions(currentUser.id);
      const canManageStatus = permissions.includes('orders:manage_status');

      if (!canManageStatus) {
        // Force default status regardless of what was sent
        const defaultStatus = await prisma.status.findFirst({ where: { isDefault: true, deletedAt: null } });
        if (!defaultStatus) return sendError(res, 'CONFIG_ERROR', 'No default status configured', 500);
        statusId = defaultStatus.id;
      }
    }

    // ... rest of create logic unchanged, using the (possibly overridden) statusId
  }
}
```

**Step 4 — Orders Controller: Enforce on Update**

In the `updateOrder` handler:

```typescript
// If user is trying to change statusId
if (req.body.statusId !== undefined) {
  const isAdminOrSuper = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  if (!isAdminOrSuper) {
    const permissions = await PermissionsService.getEffectivePermissions(currentUser.id);
    if (!permissions.includes('orders:manage_status')) {
      return sendError(res, 'FORBIDDEN', 'You do not have permission to change order status', 403);
    }
  }
}
```

### Frontend Changes

**Order Create Form / Paste Parser (`apps/web/src/components/orders/OrderPasteParser.tsx` and the manual order form)**

- Check if the current user has `orders:manage_status` permission (this is available in the auth store as `effectivePermissions`).
- If they do not have it, hide the status selector entirely from the create form. Do not show the field, do not send a `statusId` in the request body.
- For the edit order form: similarly hide or disable the status field if the user lacks `orders:manage_status`.

```typescript
const canManageStatus = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ||
  (user as any)?.effectivePermissions?.includes('orders:manage_status');
```

---

## FEATURE 5 — Smart Order Copy: "Copy Details" vs "Copy Full Details"

### What is needed
- Current "Copy Details" button copies all order fields.
- New behaviour: **"Copy Details"** copies only the data that was originally pasted into the parser (the raw parsed text as originally inputted).
- **"Copy Full Details"** copies everything (current behaviour).
- The raw original pasted text must be stored on the order at creation time.

### Backend Changes

**Step 1 — Prisma Schema: Store raw pasted text on Order**

```prisma
model Order {
  // ... existing fields ...
  parsedRawText String? @map("parsed_raw_text") @db.Text  // ADD THIS
}
```

Create migration: `npx prisma migrate dev --name add_order_parsed_raw_text`

**Step 2 — Orders Service: Save raw text on creation**

In `createOrder`, accept and store `parsedRawText`:

```typescript
static async createOrder(params: {
  statusId: string;
  deliveryDate?: Date;
  customFields?: Record<string, any>;
  notes?: string;
  createdBy: string;
  parsedRawText?: string;   // ADD
}) {
  return prisma.order.create({
    data: {
      // ... existing fields ...
      parsedRawText: params.parsedRawText ?? null,
    },
    // ...
  });
}
```

**Step 3 — Orders Service: New `getOrderParsedText` method**

```typescript
static async getOrderParsedText(id: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { parsedRawText: true },
  });
  return order?.parsedRawText ?? null;
}
```

**Step 4 — Orders Controller: New endpoint**

```typescript
// In orders.routes.ts, add:
router.get('/:id/parsed-text', authenticate, OrdersController.getParsedText);

// In orders.controller.ts, add:
static async getParsedText(req: Request, res: Response, next: NextFunction) {
  try {
    const text = await OrdersService.getOrderParsedText(req.params.id);
    if (text === null) return sendError(res, 'NOT_FOUND', 'No parsed text stored for this order', 404);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(text);
  } catch (error) {
    next(error);
  }
}
```

**Step 5 — Update Parse-and-Create flow**

In the `parsePaste` controller (or wherever orders are created from the parser), pass `parsedRawText: req.body.rawText` to `createOrder`.

In `OrderPasteParser.tsx`, when submitting the parsed order, include `parsedRawText: rawText` in the create request body.

### Frontend Changes

**Order Detail Page (`apps/web/src/pages/orders/OrderDetailPage.tsx`)**

Replace the single "Copy Details" button with two buttons:

```tsx
{/* Copy Details — only original parsed data */}
<button onClick={handleCopyParsedText} ...>
  Copy Details
</button>

{/* Copy Full Details — all fields, current behaviour */}
<button onClick={handleCopyOrder} ...>
  Copy Full Details
</button>
```

Implement `handleCopyParsedText`:

```typescript
const handleCopyParsedText = async () => {
  try {
    const { data } = await api.get(`/orders/${id}/parsed-text`, { responseType: 'text' });
    await navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data));
    toast.success('Original order details copied');
  } catch (error: any) {
    if (error.response?.status === 404) {
      toast.error('No original parsed text available for this order');
    } else {
      toast.error('Failed to copy details');
    }
  }
};
```

If `parsedRawText` is null (order created manually, not via parser), the "Copy Details" button should either be hidden or show a toast explaining it is only available for parser-created orders.

---

## FEATURE 6 — Smarter Order Paste Parser

### What is needed

**6a — Multi-value fields**: A single field label in the pasted text may contain multiple values (e.g., a contact field with two phone numbers, a products field with multiple line items). Currently, only the first value is captured and the rest goes to notes. All values should be stored in the field.

**6b — WhatsApp number auto-detection**: If a value in a phone/contact field contains the word "whatsapp" (case-insensitive), the number associated with it should automatically be routed to the WhatsApp field if it exists in the system's custom fields.

**6c — Multi-line product detection**: The products field can span multiple lines (continuation lines that don't start with a field label). The parser should treat continuation lines after a matched field as additional values for that field, not as notes.

**6d — Smarter custom field matching**: If new custom fields are added to the system, the parser should be able to match them using the same fuzzy matching algorithm already in place — no code change needed beyond ensuring all active fields are passed to `parsePasteText`.

### Backend Changes — `apps/api/src/utils/pasteParser.ts`

**6a + 6c — Multi-line and multi-value parsing**

Rewrite `parsePasteText` to support continuation lines:

```typescript
export function parsePasteText(rawText: string, fields: FieldDefinition[]): ParseResult {
  const mappedFields: Record<string, string[]> = {}; // Now stores arrays
  const unknownFields: Array<{ candidateName: string; candidateValue: string }> = [];
  const noteLines: string[] = [];

  const lines = rawText.split(/\r?\n/);
  let lastMatchedFieldId: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      lastMatchedFieldId = null; // Blank line resets continuation
      continue;
    }

    const parsed = splitLine(trimmedLine);

    if (!parsed) {
      // No delimiter — could be a continuation of the previous field
      if (lastMatchedFieldId) {
        // Append as additional value to the last matched field
        mappedFields[lastMatchedFieldId] = mappedFields[lastMatchedFieldId] || [];
        mappedFields[lastMatchedFieldId].push(trimmedLine);
      } else {
        noteLines.push(trimmedLine);
      }
      continue;
    }

    if (!parsed.value) continue;

    const matchedField = matchField(parsed.key, fields);

    if (matchedField) {
      mappedFields[matchedField.id] = mappedFields[matchedField.id] || [];
      mappedFields[matchedField.id].push(normalizeValue(parsed.value, matchedField.type));
      lastMatchedFieldId = matchedField.id;
    } else {
      unknownFields.push({
        candidateName: parsed.key,
        candidateValue: parsed.value,
      });
      lastMatchedFieldId = null;
    }
  }

  // Convert arrays to strings: join multiple values with ' | '
  const finalMappedFields: Record<string, string> = {};
  for (const [fieldId, values] of Object.entries(mappedFields)) {
    finalMappedFields[fieldId] = values.join(' | ');
  }

  return {
    mappedFields: finalMappedFields,
    unknownFields,
    notes: noteLines.join('\n'),
  };
}
```

**6b — WhatsApp auto-detection**

In the value processing section, after a phone/contact field is matched, check if the raw value contains "whatsapp". If it does, look for a field named `whatsapp` or with a label containing "whatsapp" and route the number to it:

```typescript
// After matching a field and before pushing to mappedFields:
if (matchedField.type === 'PHONE' || matchedField.name === 'customerPhone') {
  const rawValue = parsed.value;
  const parts = rawValue.split(/[|,\/]/).map(p => p.trim());

  for (const part of parts) {
    const isWhatsApp = /whatsapp/i.test(part);
    const number = part.replace(/whatsapp/i, '').trim();

    if (isWhatsApp) {
      const whatsappField = fields.find(f =>
        f.name.toLowerCase().includes('whatsapp') ||
        f.label.toLowerCase().includes('whatsapp')
      );
      if (whatsappField) {
        mappedFields[whatsappField.id] = mappedFields[whatsappField.id] || [];
        mappedFields[whatsappField.id].push(normalizeValue(number, whatsappField.type));
        continue;
      }
    }

    // Regular phone number — add to the matched field
    mappedFields[matchedField.id] = mappedFields[matchedField.id] || [];
    mappedFields[matchedField.id].push(normalizeValue(part, matchedField.type));
  }
  lastMatchedFieldId = matchedField.id;
  continue; // Skip the default push below
}
```

### Frontend Changes

No frontend changes needed for the parser logic itself. The parser runs server-side. However, after this change, field values that have multiple entries (joined with ` | `) should display properly in the order detail view — they will render as plain text with ` | ` separating values, which is readable without any change.

---

## FEATURE 7 — Fix Payment Display (Remove Negative Sign)

### What is broken
- Payments are displayed as `-($amount)` in the order table and detail view. This is misleading.
- They should display as `$amount` (positive, without the negative prefix).

### Where to fix

Search for where payments are formatted before display. This is likely in:
- `apps/web/src/pages/orders/OrderDetailPage.tsx`
- `apps/web/src/pages/orders/OrdersPage.tsx`
- Or in a shared utility/formatter function

Find the code that renders payment values. Look for patterns like:
- `value * -1`
- `Math.abs(value)`
- `-${amount}`
- `parseFloat(value) < 0`

**Fix:** Wherever a payment amount is rendered, apply `Math.abs(parseFloat(value))` before displaying it, and format it with a `$` prefix. Do not change how the value is stored in the database — only change how it is displayed.

If payments are stored as negative numbers in the DB (which would be architecturally wrong), that is a separate issue — do not change the DB values in this mandate. Only fix the display layer.

---

## TESTING CHECKLIST

After implementing ALL features, run through this checklist before the final commit:

### TypeScript
- [ ] `npm run typecheck --workspace=apps/web` — zero errors
- [ ] `npm run typecheck --workspace=apps/api` — zero errors

### Database
- [ ] All new migration files exist in `apps/api/prisma/migrations/`
- [ ] `npx prisma validate` passes
- [ ] New seeds run without error

### Announcements
- [ ] Admin creates announcement → appears in Announcements tab immediately
- [ ] User marks the announcement notification as read → announcement still appears in Announcements tab
- [ ] Announcement created 31+ days ago → hidden from user view, still visible to admin
- [ ] New user created today → sees today's announcements, not ones from last week
- [ ] Appearance tab changes by User A do not affect User B

### Orders & Permissions
- [ ] New user creates order → status is automatically set to default "Undecided", user cannot change it
- [ ] Admin grants `orders:manage_status` to user → user can now change status
- [ ] New user sees only their own orders
- [ ] Admin grants `orders:view_all` to user → user now sees all orders
- [ ] Admin always sees all orders

### Copy Details
- [ ] Order created via parser → "Copy Details" copies original raw text, "Copy Full Details" copies all fields
- [ ] Order created manually (no parser) → "Copy Details" button is hidden or shows appropriate message

### Parser
- [ ] Contact field with two numbers (one WhatsApp) → both are parsed, WhatsApp number goes to WhatsApp field if it exists
- [ ] Products with two line items → both appear in the products field, not one in products and one in notes
- [ ] Unknown field in pasted text → still offered as new field option (existing behaviour unchanged)

### Payments
- [ ] Payment amounts display as positive `$X` not `-($X)` in all views

### Deployment Safety
- [ ] Build passes locally: `cd apps/web && npx vite build`
- [ ] No new console errors in browser after deploying
- [ ] Railway redeploys cleanly after schema migration

---

## COMMIT SEQUENCE

After all features are implemented and the checklist passes, commit in this order:

1. `[SCHEMA] Add announcement expiresAt and order parsedRawText fields, add UserSetting model`
2. `[SEED] Add orders:view_all and orders:manage_status permissions`
3. `[FEATURE] Announcement lifecycle - expiry, visibility fix, new user date filter`
4. `[FEATURE] User-level appearance settings via UserSetting model`
5. `[FEATURE] Order permissions - view own only and manage status defaults`
6. `[FEATURE] Order copy - separate Copy Details and Copy Full Details buttons`
7. `[FEATURE] Smarter paste parser - multi-value, WhatsApp detection, continuation lines`
8. `[FIX] Payment display - show positive amounts without negative prefix`
9. `[QA] Typechecks pass, all checklist items verified`

---

## WHAT NOT TO DO

- Do not change the `packages/shared` types without updating both `apps/api` and `apps/web` to match.
- Do not delete existing permission names — only add new ones.
- Do not change the `/settings` endpoint — it is used by notification, status, field, and other global settings that must remain global.
- Do not add a `vercel.json` to the repo — it is not present and Vercel is configured via dashboard settings.
- Do not change the Railway Start Command — it is currently set to `cd apps/api && node dist/index.js` and working correctly.
- Do not add `console.log` statements to production code.
- Do not use `any` type in TypeScript unless the existing code already uses it at that location.
