import { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { SYSTEM_USER_ID } from '../constants';

const handleError = (next: NextFunction, error: unknown): void => {
  if (error instanceof AppError) {
    next(error);
  } else {
    const errorMessage = error instanceof Error ? error.message : String(error);
    next(new AppError(errorMessage || 'An error occurred', 500));
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
        this.where('user_id', userId).orWhere('user_id', SYSTEM_USER_ID);
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new AppError('Category not found', 404);
    }

    const category = await db('categories')
      .select('*')
      .where('id', id)
      .where(function() {
        this.where('user_id', userId).orWhere('user_id', SYSTEM_USER_ID);
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

// Tags (replaces SubCategories)
export const getTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { search } = req.query;

    let query = db('tags')
      .select('*')
      .where(function() {
        this.where('user_id', userId).orWhere('user_id', SYSTEM_USER_ID);
      });

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const tags = await query.orderBy('name', 'asc');

    res.json({ tags });
  } catch (error) {
    handleError(next, error);
  }
};

export const getTagById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const tag = await db('tags')
      .where('id', id)
      .where(function() {
        this.where('user_id', userId).orWhere('user_id', SYSTEM_USER_ID);
      })
      .first();

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    res.json({ tag });
  } catch (error) {
    handleError(next, error);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { name, color } = req.body;

    const [tag] = await db('tags')
      .insert({
        user_id: userId,
        name,
        color: color || '#3B82F6',
      })
      .returning('*');

    res.status(201).json({ tag });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error?.code === '23505') {
      next(new AppError('Tag with this name already exists', 400));
    } else {
      handleError(next, error);
    }
  }
};

export const updateTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await db('tags')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    const [updatedTag] = await db('tags')
      .where('id', id)
      .update({
        name: name || tag.name,
        color: color || tag.color,
      })
      .returning('*');

    res.json({ tag: updatedTag });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error?.code === '23505') {
      next(new AppError('Tag with this name already exists', 400));
    } else {
      handleError(next, error);
    }
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const tag = await db('tags')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    await db('tags').where('id', id).del();

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};
