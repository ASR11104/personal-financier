import { Router } from 'express';
import { query } from 'express-validator';
import * as metricsController from '../controllers/metricsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/metrics?months=6
router.get(
    '/',
    [
        query('months').optional().isInt({ min: 1, max: 60 }),
    ],
    metricsController.getFinancialMetrics
);

export default router;
