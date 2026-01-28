import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('last_name').optional().trim(),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);

router.get('/profile', authenticate, authController.getProfile);

router.put(
  '/profile',
  authenticate,
  [
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim(),
    body('default_currency').optional().isLength({ min: 3, max: 3 }),
    body('timezone').optional().trim(),
  ],
  authController.updateProfile
);

export default router;
