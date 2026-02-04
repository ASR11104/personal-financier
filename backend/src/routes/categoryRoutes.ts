import { Router } from 'express';
import { body, query } from 'express-validator';
import * as categoryController from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Tags routes (replaces SubCategories)
router.get(
  '/tags',
  [
    query('search').optional().trim(),
  ],
  categoryController.getTags
);

router.get('/tags/:id', categoryController.getTagById);

router.post(
  '/tags',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('color').optional().trim().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  categoryController.createTag
);

router.put(
  '/tags/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('color').optional().trim().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  categoryController.updateTag
);

router.delete('/tags/:id', categoryController.deleteTag);

// Categories routes
router.get(
  '/',
  [
    query('type').optional().isIn(['income', 'expense', 'transfer']),
  ],
  categoryController.getCategories
);

router.get('/:id', categoryController.getCategoryById);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('type').isIn(['income', 'expense', 'transfer']),
    body('description').optional().trim().isLength({ max: 256 }),
  ],
  categoryController.createCategory
);

router.put(
  '/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 256 }),
  ],
  categoryController.updateCategory
);

router.delete('/:id', categoryController.deleteCategory);

export default router;
