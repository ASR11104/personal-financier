import { Router } from 'express';
import authRoutes from './authRoutes';
import accountRoutes from './accountRoutes';
import expenseRoutes from './expenseRoutes';
import incomeRoutes from './incomeRoutes';
import investmentRoutes from './investmentRoutes';
import categoryRoutes from './categoryRoutes';
import analyticsRoutes from './analyticsRoutes';
import metricsRoutes from './metricsRoutes';
import financialPreferencesRoutes from './financialPreferencesRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/expenses', expenseRoutes);
router.use('/incomes', incomeRoutes);
router.use('/investments', investmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/metrics', metricsRoutes);
router.use('/financial-preferences', financialPreferencesRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
