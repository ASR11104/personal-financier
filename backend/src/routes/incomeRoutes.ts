import { Router } from 'express';
import { body, query } from 'express-validator';
import * as incomeController from '../controllers/incomeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('start_date').optional().isDate(),
    query('end_date').optional().isDate(),
    query('category_id').optional().isUUID(),
    query('account_id').optional().isUUID(),
    query('tag_id').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  incomeController.getIncomes
);

router.get('/summary', [
  query('start_date').optional().isDate(),
  query('end_date').optional().isDate(),
], incomeController.getIncomeSummary);

router.get('/:id', incomeController.getIncomeById);

router.post(
  '/',
  [
    body('account_id').isUUID(),
    body('category_id').isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('description').optional().trim(),
    body('income_date').isDate(),
    body('tag_ids').optional().isArray(),
    body('tag_ids.*').optional().isUUID(),
  ],
  incomeController.createIncome
);

router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('description').optional().trim(),
    body('income_date').optional().isDate(),
    body('category_id').optional().isUUID(),
    body('tag_ids').optional().isArray(),
    body('tag_ids.*').optional().isUUID(),
  ],
  incomeController.updateIncome
);

router.delete('/:id', incomeController.deleteIncome);

export default router;
