import { Router } from 'express';
import { body, query } from 'express-validator';
import * as expenseController from '../controllers/expenseController';
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
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  expenseController.getExpenses
);

router.get('/summary', expenseController.getExpenseSummary);

router.get('/:id', expenseController.getExpenseById);

router.post(
  '/',
  [
    body('account_id').isUUID(),
    body('category_id').isUUID(),
    body('sub_category_id').optional().isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('description').optional().trim(),
    body('expense_date').isDate(),
  ],
  expenseController.createExpense
);

router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('description').optional().trim(),
    body('expense_date').optional().isDate(),
  ],
  expenseController.updateExpense
);

router.delete('/:id', expenseController.deleteExpense);

export default router;
