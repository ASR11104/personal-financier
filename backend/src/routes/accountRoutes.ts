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
  ],
  accountController.updateAccount
);

router.delete('/:id', accountController.deleteAccount);

export default router;
