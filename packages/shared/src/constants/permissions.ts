// All permission name constants — matches Section 3 Module 1 exactly

export const PERMISSIONS = {
  // Orders
  ORDERS_CREATE: 'orders:create',
  ORDERS_VIEW_ALL: 'orders:view_all',
  ORDERS_EDIT_OWN: 'orders:edit_own',
  ORDERS_EDIT_ANY: 'orders:edit_any',
  ORDERS_DELETE_OWN: 'orders:delete_own',
  ORDERS_DELETE_ANY: 'orders:delete_any',

  // Status management
  STATUS_CREATE: 'status:create',
  STATUS_MANAGE: 'status:manage',

  // Field management
  FIELDS_CREATE: 'fields:create',
  FIELDS_MAKE_REQUIRED: 'fields:make_required',

  // Payroll
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_EDIT: 'payroll:edit',

  // Facebook Accounts
  FB_ACCOUNTS_VIEW: 'fb_accounts:view',
  FB_ACCOUNTS_EDIT: 'fb_accounts:edit',

  // User management
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',

  // Settings
  SETTINGS_ACCESS: 'settings:access',

  // Announcements
  ANNOUNCEMENTS_MANAGE: 'announcements:manage',

  // Audit log
  AUDIT_VIEW: 'audit:view',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// All permission names as an array
export const ALL_PERMISSIONS: PermissionName[] = Object.values(PERMISSIONS);

// Permission descriptions for UI display
export const PERMISSION_DESCRIPTIONS: Record<PermissionName, string> = {
  [PERMISSIONS.ORDERS_CREATE]: 'Create new orders',
  [PERMISSIONS.ORDERS_VIEW_ALL]: 'Can view all orders, not just own',
  [PERMISSIONS.ORDERS_EDIT_OWN]: 'Edit own orders (within edit window)',
  [PERMISSIONS.ORDERS_EDIT_ANY]: 'Edit any order regardless of owner',
  [PERMISSIONS.ORDERS_DELETE_OWN]: 'Delete own orders (within edit window)',
  [PERMISSIONS.ORDERS_DELETE_ANY]: 'Delete any order regardless of owner',
  [PERMISSIONS.STATUS_CREATE]: 'Create new order statuses',
  [PERMISSIONS.STATUS_MANAGE]: 'Edit, reorder, and archive any status',
  [PERMISSIONS.FIELDS_CREATE]: 'Add new custom fields to orders',
  [PERMISSIONS.FIELDS_MAKE_REQUIRED]: 'Mark custom fields as required',
  [PERMISSIONS.PAYROLL_VIEW]: 'View payroll data',
  [PERMISSIONS.PAYROLL_EDIT]: 'Create and edit payroll entries',
  [PERMISSIONS.FB_ACCOUNTS_VIEW]: 'View Facebook account records',
  [PERMISSIONS.FB_ACCOUNTS_EDIT]: 'Create and edit Facebook account records',
  [PERMISSIONS.USERS_VIEW]: 'View user list and profiles',
  [PERMISSIONS.USERS_MANAGE]: 'Create, edit, suspend, and manage users',
  [PERMISSIONS.SETTINGS_ACCESS]: 'Access and modify system settings',
  [PERMISSIONS.ANNOUNCEMENTS_MANAGE]: 'Create, edit, and delete announcements',
  [PERMISSIONS.AUDIT_VIEW]: 'View system audit log',
};

// Permission modules for grouping in UI
export const PERMISSION_MODULES: Record<string, PermissionName[]> = {
  Orders: [
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT_OWN,
    PERMISSIONS.ORDERS_EDIT_ANY,
    PERMISSIONS.ORDERS_DELETE_OWN,
    PERMISSIONS.ORDERS_DELETE_ANY,
  ],
  Statuses: [
    PERMISSIONS.STATUS_CREATE,
    PERMISSIONS.STATUS_MANAGE,
  ],
  Fields: [
    PERMISSIONS.FIELDS_CREATE,
    PERMISSIONS.FIELDS_MAKE_REQUIRED,
  ],
  Payroll: [
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_EDIT,
  ],
  'Facebook Accounts': [
    PERMISSIONS.FB_ACCOUNTS_VIEW,
    PERMISSIONS.FB_ACCOUNTS_EDIT,
  ],
  Users: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
  ],
  Settings: [
    PERMISSIONS.SETTINGS_ACCESS,
  ],
  Announcements: [
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
  ],
  Audit: [
    PERMISSIONS.AUDIT_VIEW,
  ],
};

// Default USER role permissions (from Section 3 Module 1)
export const DEFAULT_USER_PERMISSIONS: PermissionName[] = [
  PERMISSIONS.ORDERS_CREATE,
  PERMISSIONS.ORDERS_EDIT_OWN,
  PERMISSIONS.ORDERS_DELETE_OWN,
  PERMISSIONS.STATUS_CREATE,
  PERMISSIONS.FIELDS_CREATE,
];
