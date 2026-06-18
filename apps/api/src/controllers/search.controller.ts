import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const user = (req as any).user!;
      
      const results = await searchService.globalSearch(query || '', user as any);
      
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
