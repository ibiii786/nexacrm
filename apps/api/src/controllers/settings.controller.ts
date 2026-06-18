import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { z } from 'zod';

const updateSettingsSchema = z.record(z.string(), z.string());

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const settingsData = updateSettingsSchema.parse(req.body);
      const userId = (req as any).user!.id;

      const updatedSettings = await settingsService.updateSettings(settingsData, userId);
      res.json({ success: true, data: updatedSettings });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
