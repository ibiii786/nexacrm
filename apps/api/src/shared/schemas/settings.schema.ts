import { z } from 'zod';

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().min(1),
    value: z.string(),
  })).min(1, 'Provide at least one setting'),
});

// Known settings keys
export const SETTINGS_KEYS = {
  COMPANY_NAME: 'company.name',
  COMPANY_LOGO: 'company.logo',
  TIMEZONE: 'company.timezone',
  LANGUAGE: 'company.language',
  EDIT_WINDOW_MINUTES: 'orders.editWindowMinutes',
  SESSION_TIMEOUT_MINUTES: 'auth.sessionTimeoutMinutes',
  DATE_FORMAT: 'display.dateFormat',
  PRIMARY_COLOR: 'appearance.primaryColor',
  NOTIFICATIONS_IN_APP: 'notifications.inApp',
  NOTIFICATIONS_EMAIL: 'notifications.email',
  MODULE_PAYROLL_ENABLED: 'module.payroll.enabled',
  MODULE_FB_ACCOUNTS_ENABLED: 'module.fb_accounts.enabled',
} as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

// Default settings values
export const DEFAULT_SETTINGS: Record<SettingsKey, string> = {
  [SETTINGS_KEYS.COMPANY_NAME]: 'NexaCRM',
  [SETTINGS_KEYS.COMPANY_LOGO]: '',
  [SETTINGS_KEYS.TIMEZONE]: 'America/Toronto',
  [SETTINGS_KEYS.LANGUAGE]: 'en',
  [SETTINGS_KEYS.EDIT_WINDOW_MINUTES]: '30',
  [SETTINGS_KEYS.SESSION_TIMEOUT_MINUTES]: '30',
  [SETTINGS_KEYS.DATE_FORMAT]: 'MMM dd, yyyy',
  [SETTINGS_KEYS.PRIMARY_COLOR]: '#4F46E5',
  [SETTINGS_KEYS.NOTIFICATIONS_IN_APP]: 'true',
  [SETTINGS_KEYS.NOTIFICATIONS_EMAIL]: 'true',
  [SETTINGS_KEYS.MODULE_PAYROLL_ENABLED]: 'false',
  [SETTINGS_KEYS.MODULE_FB_ACCOUNTS_ENABLED]: 'false',
};

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
