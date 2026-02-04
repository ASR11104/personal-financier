import { Router } from 'express';
import { body } from 'express-validator';
import * as accountController from '../controllers/accountController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', accountController.getAccounts);

router.get('/balance', accountController.getAccountBalance);

router.get('/:id', accountController.getAccountById);

router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('type')
      .isIn(['checking', 'savings', 'credit_card', 'cash', 'investment', 'loan']),
    body('currency').isLength({ min: 3, max: 3 }),
    body('institution_name').optional().trim().isLength({ max: 100 }),
    body('balance').optional().isFloat({ min: 0 }),
  ],
  accountController.createAccount
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('type')
      .optional()
      .isIn(['checking', 'savings', 'credit_card', 'cash', 'investment', 'loan']),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('institution_name').optional().trim().isLength({ max: 100 }),
    body('balance').optional().isFloat({ min: 0 }),
    body('is_active').optional().isBoolean(),
    body('details.credit_limit').optional().isFloat({ min: 0 }),
    body('details.available_credit').optional().isFloat({ min: 0 }),
    body('details.loan_amount').optional().isFloat({ min: 0 }),
    body('details.loan_balance').optional().isFloat({ min: 0 }),
    body('details.interest_rate').optional().isFloat({ min: 0 }),
  ],
  accountController.updateAccount
);

router.delete('/:id', accountController.deleteAccount);

router.post('/:id/reactivate', accountController.reactivateAccount);

export default router;
