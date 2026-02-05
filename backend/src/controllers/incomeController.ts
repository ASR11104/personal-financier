import { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

const handleError = (next: NextFunction, error: unknown): void => {
  if (error instanceof AppError) {
    next(error);
  } else {
    const errorMessage = error instanceof Error ? error.message : String(error);
    next(new AppError(errorMessage || 'An error occurred', 500));
  }
};

// Helper function to get tags for an income
const getIncomeTags = async (incomeId: string): Promise<any[]> => {
  const tags = await db('income_tags')
    .select('tags.*')
    .join('tags', 'income_tags.tag_id', 'tags.id')
    .where('income_tags.income_id', incomeId);

  return tags;
};

// Helper function to link tags to an income
const linkTagsToIncome = async (incomeId: string, tagIds: string[]): Promise<void> => {
  if (!tagIds || tagIds.length === 0) return;

  const incomeTags = tagIds.map((tagId) => ({
    income_id: incomeId,
    tag_id: tagId,
  }));

  await db('income_tags').insert(incomeTags);
};

// Helper function to unlink all tags from an income
const unlinkTagsFromIncome = async (incomeId: string): Promise<void> => {
  await db('income_tags').where('income_id', incomeId).delete();
};

export const createIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { account_id, category_id, amount, description, income_date, tag_ids } = req.body;

    // Get account type to determine how to update
    const account = await db('accounts').where('id', account_id).first();
    if (!account) {
      throw new AppError('Account not found', 404);
    }

    const [income] = await db('incomes')
      .insert({
        user_id: userId,
        account_id,
        category_id,
        amount,
        description,
        income_date,
      })
      .returning('*');

    // Link tags to income
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      await linkTagsToIncome(income.id, tag_ids);
    }

    // Create ledger entry
    await db('ledger_entries').insert({
      account_id,
      income_id: income.id,
      amount: amount,
    });

    // Update account balance or available_credit based on account type
    if (account.type === 'credit_card') {
      // For credit cards, increase available_credit
      await db('account_details')
        .where('account_id', account_id)
        .increment('available_credit', amount);
    } else {
      // For other accounts, increase balance
      await db('accounts')
        .where('id', account_id)
        .increment('balance', amount);
    }

    // Get tags for the response
    const tags = await getIncomeTags(income.id);

    res.status(201).json({ income: { ...income, tags } });
  } catch (error) {
    handleError(next, error);
  }
};

export const getIncomes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date, category_id, account_id, tag_id, limit = 50, offset = 0 } = req.query;

    let query = db('incomes')
      .select(
        'incomes.*',
        'categories.name as category_name',
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'incomes.category_id', 'categories.id')
      .leftJoin('accounts', 'incomes.account_id', 'accounts.id')
      .where('incomes.user_id', userId)
      .whereNull('incomes.deleted_at');

    if (start_date) {
      query = query.where('incomes.income_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('incomes.income_date', '<=', end_date);
    }
    if (category_id) {
      query = query.where('incomes.category_id', category_id);
    }
    if (account_id) {
      query = query.where('incomes.account_id', account_id);
    }

    const incomes = await query
      .orderBy('incomes.income_date', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    // Get tags for each income
    const incomesWithTags = await Promise.all(
      incomes.map(async (income) => {
        const tags = await getIncomeTags(income.id);
        return { ...income, tags };
      })
    );

    res.json({ incomes: incomesWithTags });
  } catch (error) {
    handleError(next, error);
  }
};

export const getIncomeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const income = await db('incomes')
      .select(
        'incomes.*',
        'categories.name as category_name',
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'incomes.category_id', 'categories.id')
      .leftJoin('accounts', 'incomes.account_id', 'accounts.id')
      .where('incomes.id', id)
      .where('incomes.user_id', userId)
      .first();

    if (!income) {
      throw new AppError('Income not found', 404);
    }

    // Get tags for the income
    const tags = await getIncomeTags(income.id);

    res.json({ income: { ...income, tags } });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { amount, description, income_date, category_id, tag_ids } = req.body;

    const income = await db('incomes')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!income) {
      throw new AppError('Income not found', 404);
    }

    // Get account type to determine how to update
    const account = await db('accounts').where('id', income.account_id).first();

    // Revert old ledger entry and update account balance
    await db('ledger_entries')
      .where('income_id', id)
      .delete();

    // Revert the old amount based on account type
    if (account.type === 'credit_card') {
      await db('account_details')
        .where('account_id', income.account_id)
        .decrement('available_credit', income.amount);
    } else {
      await db('accounts')
        .where('id', income.account_id)
        .decrement('balance', income.amount);
    }

    // Update income
    const [updatedIncome] = await db('incomes')
      .where('id', id)
      .update({
        amount: amount !== undefined ? amount : income.amount,
        description: description !== undefined ? description : income.description,
        income_date: income_date || income.income_date,
        category_id: category_id || income.category_id,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Update tags if provided
    if (tag_ids !== undefined) {
      await unlinkTagsFromIncome(id);
      if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
        await linkTagsToIncome(id, tag_ids);
      }
    }

    // Create new ledger entry and update account balance
    await db('ledger_entries').insert({
      account_id: income.account_id,
      income_id: updatedIncome.id,
      amount: updatedIncome.amount,
    });

    // Apply the new amount based on account type
    if (account.type === 'credit_card') {
      await db('account_details')
        .where('account_id', income.account_id)
        .increment('available_credit', updatedIncome.amount);
    } else {
      await db('accounts')
        .where('id', income.account_id)
        .increment('balance', updatedIncome.amount);
    }

    // Get tags for the response
    const tags = await getIncomeTags(updatedIncome.id);

    res.json({ income: { ...updatedIncome, tags } });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const income = await db('incomes')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!income) {
      throw new AppError('Income not found', 404);
    }

    // Get account type to determine how to update
    const account = await db('accounts').where('id', income.account_id).first();

    // Soft delete
    await db('incomes')
      .where('id', id)
      .update({
        deleted_at: db.fn.now(),
      });

    // Unlink all tags
    await unlinkTagsFromIncome(id);

    // Revert account balance based on account type
    if (account.type === 'credit_card') {
      await db('account_details')
        .where('account_id', income.account_id)
        .decrement('available_credit', income.amount);
    } else {
      await db('accounts')
        .where('id', income.account_id)
        .decrement('balance', income.amount);
    }

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};

export const getIncomeSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date } = req.query;

    let query = db('incomes')
      .select(
        db.raw('COUNT(*) as total_count'),
        db.raw('COALESCE(SUM(amount), 0) as total_amount')
      )
      .where('user_id', userId)
      .whereNull('deleted_at');

    if (start_date) {
      query = query.where('income_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('income_date', '<=', end_date);
    }

    const summary = await query.first();

    // Get category breakdown
    const byCategory = await db('incomes')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(incomes.amount), 0) as total')
      )
      .leftJoin('categories', 'incomes.category_id', 'categories.id')
      .where('incomes.user_id', userId)
      .whereNull('incomes.deleted_at')
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
