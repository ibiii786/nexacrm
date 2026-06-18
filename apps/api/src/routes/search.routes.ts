import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All authenticated users can search
router.get('/', authenticate, searchController.search.bind(searchController));

export default router;
