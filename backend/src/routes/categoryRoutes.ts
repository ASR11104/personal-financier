import { Router } from 'express';
import { body, query } from 'express-validator';
import * as categoryController from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

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

// SubCategories routes
router.get(
  '/sub-categories',
  [
    query('category_id').optional().isUUID(),
  ],
  categoryController.getSubCategories
);

router.get('/sub-categories/:id', categoryController.getSubCategoryById);

router.post(
  '/sub-categories',
  [
    body('category_id').isUUID(),
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 256 }),
  ],
  categoryController.createSubCategory
);

router.put(
  '/sub-categories/:id',
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 256 }),
  ],
  categoryController.updateSubCategory
);

router.delete('/sub-categories/:id', categoryController.deleteSubCategory);

export default router;
