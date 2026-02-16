import { Router } from 'express';
import * as financialPreferencesController from '../controllers/financialPreferencesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/financial-preferences
router.get('/', financialPreferencesController.getPreferences);

// PUT /api/financial-preferences
router.put('/', financialPreferencesController.upsertPreferences);

export default router;
