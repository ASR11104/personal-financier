import { Router } from 'express';
import { body, query } from 'express-validator';
import * as investmentController from '../controllers/investmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('start_date').optional().isDate(),
    query('end_date').optional().isDate(),
    query('investment_type_id').optional().isUUID(),
    query('account_id').optional().isUUID(),
    query('status').optional().isIn(['active', 'sold', 'withdrawn']),
    query('is_sip').optional().isIn(['true', 'false']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  investmentController.getInvestments
);

router.get('/summary', investmentController.getInvestmentSummary);

router.get('/types', investmentController.getInvestmentTypes);

router.get('/:id', investmentController.getInvestmentById);

router.post(
  '/',
  [
    body('account_id').isUUID(),
    body('investment_type_id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 200 }),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('units').optional().trim(),
    body('purchase_price').optional().isFloat({ min: 0 }),
    body('purchase_date').optional().isDate(),
    body('description').optional().trim(),
    // SIP fields
    body('is_sip').optional().isBoolean(),
    body('sip_amount').optional().isFloat({ min: 0.01 }),
    body('sip_frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    body('sip_start_date').optional().isDate(),
    body('sip_end_date').optional().isDate(),
    body('sip_day_of_month').optional().isInt({ min: 1, max: 28 }),
    body('sip_total_installments').optional().isInt({ min: 1 }),
  ],
  investmentController.createInvestment
);

router.put(
  '/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 200 }),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('units').optional().trim(),
    body('purchase_price').optional().isFloat({ min: 0 }),
    body('purchase_date').optional().isDate(),
    body('description').optional().trim(),
    body('investment_type_id').optional().isUUID(),
    // SIP fields
    body('is_sip').optional().isBoolean(),
    body('sip_amount').optional().isFloat({ min: 0.01 }),
    body('sip_frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    body('sip_start_date').optional().isDate(),
    body('sip_end_date').optional().isDate(),
    body('sip_day_of_month').optional().isInt({ min: 1, max: 28 }),
    body('sip_total_installments').optional().isInt({ min: 1 }),
  ],
  investmentController.updateInvestment
);

router.delete('/:id', investmentController.deleteInvestment);

// Process a single SIP payment
router.post(
  '/:id/process-sip',
  [
    body('transaction_date').optional().isDate(),
  ],
  investmentController.processSipPayment
);

router.post(
  '/:id/withdraw',
  [
    body('target_account_id').isUUID(),
    body('withdrawal_amount').optional().isFloat({ min: 0.01 }),
    body('withdrawal_date').optional().isDate(),
    body('description').optional().trim(),
  ],
  investmentController.withdrawInvestment
);

export default router;
