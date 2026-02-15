import { Router } from 'express';
import { query } from 'express-validator';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Monthly expense trends
router.get(
  '/expense-trends',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getMonthlyExpenseTrends
);

// Monthly income trends
router.get(
  '/income-trends',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getMonthlyIncomeTrends
);

// Income vs Expense comparison
router.get(
  '/income-vs-expense',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getIncomeVsExpense
);

// Account analytics (net worth, debt, etc.)
router.get('/accounts', analyticsController.getAccountAnalytics);

// Spending by day of week
router.get(
  '/spending-by-day',
  [
    query('months').optional().isInt({ min: 1, max: 24 }),
  ],
  analyticsController.getSpendingByDayOfWeek
);

// Spending by tags
router.get(
  '/spending-by-tags',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getSpendingByTags
);

// Income by tags
router.get(
  '/income-by-tags',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getIncomeByTags
);

// Investment overview
router.get('/investments/overview', analyticsController.getInvestmentOverview);

// Investment trends
router.get(
  '/investments/trends',
  [
    query('months').optional().isInt({ min: 1, max: 60 }),
  ],
  analyticsController.getInvestmentTrends
);

// Investment performance
router.get('/investments/performance', analyticsController.getInvestmentPerformance);

// Loan amortization schedule
router.get('/loans/amortization', analyticsController.getLoanAmortization);

export default router;
