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

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { account_id, category_id, sub_category_id, amount, description, expense_date } = req.body;

    const [expense] = await db('expenses')
      .insert({
        user_id: userId,
        account_id,
        category_id,
        sub_category_id,
        amount,
        description,
        expense_date,
      })
      .returning('*');

    // Create ledger entry
    await db('ledger_entries').insert({
      account_id,
      expense_id: expense.id,
      amount: -amount,
    });

    // Update account balance
    await db('accounts')
      .where('id', account_id)
      .decrement('balance', amount);

    res.status(201).json({ expense });
  } catch (error) {
    handleError(next, error);
  }
};

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date, category_id, account_id, limit = 50, offset = 0 } = req.query;

    let query = db('expenses')
      .select(
        'expenses.*',
        'categories.name as category_name',
        'sub_categories.name as sub_category_name',
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('sub_categories', 'expenses.sub_category_id', 'sub_categories.id')
      .leftJoin('accounts', 'expenses.account_id', 'accounts.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at');

    if (start_date) {
      query = query.where('expenses.expense_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('expenses.expense_date', '<=', end_date);
    }
    if (category_id) {
      query = query.where('expenses.category_id', category_id);
    }
    if (account_id) {
      query = query.where('expenses.account_id', account_id);
    }

    const expenses = await query
      .orderBy('expenses.expense_date', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({ expenses });
  } catch (error) {
    handleError(next, error);
  }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const expense = await db('expenses')
      .select(
        'expenses.*',
        'categories.name as category_name',
        'sub_categories.name as sub_category_name',
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('sub_categories', 'expenses.sub_category_id', 'sub_categories.id')
      .leftJoin('accounts', 'expenses.account_id', 'accounts.id')
      .where('expenses.id', id)
      .where('expenses.user_id', userId)
      .first();

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    res.json({ expense });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { amount, description, expense_date, category_id, sub_category_id } = req.body;

    const expense = await db('expenses')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    // Revert old ledger entry and update account balance
    await db('ledger_entries')
      .where('expense_id', id)
      .delete();

    await db('accounts')
      .where('id', expense.account_id)
      .increment('balance', expense.amount);

    // Update expense
    const [updatedExpense] = await db('expenses')
      .where('id', id)
      .update({
        amount: amount !== undefined ? amount : expense.amount,
        description: description !== undefined ? description : expense.description,
        expense_date: expense_date || expense.expense_date,
        category_id: category_id || expense.category_id,
        sub_category_id: sub_category_id !== undefined ? sub_category_id : expense.sub_category_id,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Create new ledger entry and update account balance
    await db('ledger_entries').insert({
      account_id: expense.account_id,
      expense_id: updatedExpense.id,
      amount: -updatedExpense.amount,
    });

    await db('accounts')
      .where('id', expense.account_id)
      .decrement('balance', updatedExpense.amount);

    res.json({ expense: updatedExpense });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const expense = await db('expenses')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    // Soft delete
    await db('expenses')
      .where('id', id)
      .update({
        deleted_at: db.fn.now(),
      });

    // Revert account balance
    await db('accounts')
      .where('id', expense.account_id)
      .increment('balance', expense.amount);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};

export const getExpenseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date } = req.query;

    let query = db('expenses')
      .select(
        db.raw('COUNT(*) as total_count'),
        db.raw('COALESCE(SUM(amount), 0) as total_amount')
      )
      .where('user_id', userId)
      .whereNull('deleted_at');

    if (start_date) {
      query = query.where('expense_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('expense_date', '<=', end_date);
    }

    const summary = await query.first();

    // Get category breakdown
    const byCategory = await db('expenses')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .groupBy('categories.name')
      .orderBy('total', 'desc');

    res.json({
      summary: {
        total_count: summary.total_count,
        total_amount: summary.total_amount,
      },
      by_category: byCategory,
    });
  } catch (error) {
    handleError(next, error);
  }
};
