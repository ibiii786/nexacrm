import { prisma } from '../config/database';

export class SettingsService {
  /**
   * Get all settings as a key-value object
   */
  async getSettings() {
    const settings = await prisma.setting.findMany();
    
    // Default settings if empty
    const defaultSettings: Record<string, string> = {
      timezone: 'America/Toronto',
      language: 'en',
      editWindowMinutes: '30',
      sessionTimeoutMinutes: '30',
      theme: 'light',
    };

    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return { ...defaultSettings, ...settingsMap };
  }

  /**
   * Get a specific setting by key
   */
  async getSettingByKey(key: string, defaultValue: string = '') {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    return setting?.value ?? defaultValue;
  }

  /**
   * Batch update settings
   */
  async updateSettings(settings: Record<string, string>, updatedBy: string) {
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy, updatedAt: new Date() },
        create: { key, value, updatedBy }
      });
    });

    await prisma.$transaction(updatePromises);
    
    return this.getSettings();
  }
}

export const settingsService = new SettingsService();
