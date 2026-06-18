import { Request, Response, NextFunction } from 'express';
import { fbService } from '../services/fb.service';
import { AuthService } from '../services/auth.service';

export class FbController {
  async getFbAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
      };
      // remove undefined
      Object.keys(filters).forEach(key => (filters as any)[key] === undefined && delete (filters as any)[key]);

      const accounts = await fbService.getFbAccounts(filters);
      // Strip vault note from list just in case, though it's encrypted
      const safeAccounts = accounts.map(a => {
        const { vaultNoteEncrypted, ...safe } = a;
        return { ...safe, hasVaultNote: !!vaultNoteEncrypted };
      });

      res.json({ success: true, data: safeAccounts });
    } catch (error) {
      next(error);
    }
  }

  async getFbAccountById(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await fbService.getFbAccountById(req.params.id as string);
      if (!account) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
      
      const { vaultNoteEncrypted, ...safe } = account;
      res.json({ success: true, data: { ...safe, hasVaultNote: !!vaultNoteEncrypted } });
    } catch (error) {
      next(error);
    }
  }

  async createFbAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user!.id;
      const account = await fbService.createFbAccount(req.body, userId);
      
      const { vaultNoteEncrypted, ...safe } = account;
      res.status(201).json({ success: true, data: { ...safe, hasVaultNote: !!vaultNoteEncrypted } });
    } catch (error) {
      next(error);
    }
  }

  async updateFbAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user!.id;
      const account = await fbService.updateFbAccount(req.params.id as string, req.body, userId);
      
      const { vaultNoteEncrypted, ...safe } = account;
      res.json({ success: true, data: { ...safe, hasVaultNote: !!vaultNoteEncrypted } });
    } catch (error) {
      next(error);
    }
  }

  async deleteFbAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await fbService.deleteFbAccount(req.params.id as string);
      res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
      next(error);
    }
  }

  async revealVaultNote(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user!;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }

      // Verify user's password using AuthService logic (we just need to verify password against user's email)
      // Since user object from req only has id, email, role, we can do a login check or custom check
      const authSuccess = await AuthService.verifyPassword(user.id, password);
      
      if (!authSuccess) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
      }

      const note = await fbService.getDecryptedVaultNote(req.params.id as string);
      res.json({ success: true, data: { vaultNote: note } });
    } catch (error: any) {
      if (error.message === 'Account not found') {
        res.status(404).json({ success: false, message: 'Account not found' });
      } else {
        next(error);
      }
    }
  }
}

export const fbController = new FbController();
