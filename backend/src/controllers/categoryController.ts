import { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

const handleError = (next: NextFunction, error: unknown): void => {
  if (error instanceof AppError) {
    next(error);
  } else {
    next(new AppError('An error occurred', 500));
  }
};

// Categories
export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { type } = req.query;

    let query = db('categories')
      .select('*')
      .where(function() {
        this.where('user_id', userId).orWhereNull('user_id');
      });

    if (type) {
      query = query.where('type', type);
    }

    const categories = await query.orderBy('name', 'asc');

    res.json({ categories });
  } catch (error) {
    handleError(next, error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const category = await db('categories')
      .select('*')
      .where('id', id)
      .where(function() {
        this.where('user_id', userId).orWhereNull('user_id');
      })
      .first();

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({ category });
  } catch (error) {
    handleError(next, error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { name, type, description } = req.body;

    const [category] = await db('categories')
      .insert({
        user_id: userId,
        name,
        type,
        description,
      })
      .returning('*');

    res.status(201).json({ category });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await db('categories')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const [updatedCategory] = await db('categories')
      .where('id', id)
      .update({
        name: name || category.name,
        description: description !== undefined ? description : category.description,
      })
      .returning('*');

    res.json({ category: updatedCategory });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const category = await db('categories')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await db('categories').where('id', id).del();

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};

// SubCategories
export const getSubCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log("getSubCategories>>>")
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { category_id } = req.query;

    let query = db('sub_categories')
      .select('sub_categories.*', 'categories.name as category_name', 'categories.type as category_type')
      .join('categories', 'sub_categories.category_id', 'categories.id')
      .where(function() {
        this.where('categories.user_id', userId).orWhereNull('categories.user_id');
      });

    if (category_id) {
      query = query.where('sub_categories.category_id', category_id);
    }

    const subCategories = await query.orderBy('sub_categories.name', 'asc');

    res.json({ sub_categories: subCategories });
  } catch (error) {
    console.log("error")
    console.log(error)
    handleError(next, error);
  }
};

export const getSubCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const subCategory = await db('sub_categories')
      .select('sub_categories.*', 'categories.name as category_name', 'categories.type as category_type')
      .join('categories', 'sub_categories.category_id', 'categories.id')
      .where('sub_categories.id', id)
      .where(function() {
        this.where('categories.user_id', userId).orWhereNull('categories.user_id');
      })
      .first();

    if (!subCategory) {
      throw new AppError('SubCategory not found', 404);
    }

    res.json({ sub_category: subCategory });
  } catch (error) {
    handleError(next, error);
  }
};

export const createSubCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { category_id, name, description } = req.body;

    // Verify category exists and belongs to user
    const category = await db('categories')
      .where('id', category_id)
      .where(function() {
        this.where('user_id', userId).orWhereNull('user_id');
      })
      .first();

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const [subCategory] = await db('sub_categories')
      .insert({
        category_id,
        name,
        description,
      })
      .returning('*');

    res.status(201).json({ sub_category: subCategory });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateSubCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const subCategory = await db('sub_categories')
      .join('categories', 'sub_categories.category_id', 'categories.id')
      .where('sub_categories.id', id)
      .where(function() {
        this.where('categories.user_id', userId).orWhereNull('categories.user_id');
      })
      .select('sub_categories.*')
      .first();

    if (!subCategory) {
      throw new AppError('SubCategory not found', 404);
    }

    const [updatedSubCategory] = await db('sub_categories')
      .where('id', id)
      .update({
        name: name || subCategory.name,
        description: description !== undefined ? description : subCategory.description,
      })
      .returning('*');

    res.json({ sub_category: updatedSubCategory });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteSubCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const subCategory = await db('sub_categories')
      .join('categories', 'sub_categories.category_id', 'categories.id')
      .where('sub_categories.id', id)
      .where(function() {
        this.where('categories.user_id', userId).orWhereNull('categories.user_id');
      })
      .select('sub_categories.*')
      .first();

    if (!subCategory) {
      throw new AppError('SubCategory not found', 404);
    }

    await db('sub_categories').where('id', id).del();

    res.json({ message: 'SubCategory deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};
