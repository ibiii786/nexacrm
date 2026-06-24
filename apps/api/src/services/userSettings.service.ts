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
