import { Request, Response } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { name, type, currency, institution_name, balance } = req.body;

  const [account] = await db('accounts')
    .insert({
      user_id: userId,
      name,
      type,
      currency,
      institution_name,
      balance: balance || 0,
    })
    .returning('*');

  res.status(201).json({ account });
};

export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { type, is_active } = req.query;

  let query = db('accounts')
    .select('*')
    .where('user_id', userId);

  if (type) {
    query = query.where('type', type);
  }
  if (is_active !== undefined) {
    query = query.where('is_active', is_active === 'true');
  }

  const accounts = await query.orderBy('created_at', 'desc');

  res.json({ accounts });
};

export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { id } = req.params;

  const account = await db('accounts')
    .where('id', id)
    .where('user_id', userId)
    .first();

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  res.json({ account });
};

export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { id } = req.params;
  const { name, type, currency, institution_name, is_active, balance } = req.body;

  const account = await db('accounts')
    .where('id', id)
    .where('user_id', userId)
    .first();

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  const [updatedAccount] = await db('accounts')
    .where('id', id)
    .update({
      name,
      type,
      currency,
      institution_name,
      is_active,
      balance,
      updated_at: db.fn.now(),
    })
    .returning('*');

  res.json({ account: updatedAccount });
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;
  const { id } = req.params;

  const account = await db('accounts')
    .where('id', id)
    .where('user_id', userId)
    .first();

  if (!account) {
    throw new AppError('Account not found', 404);
  }

  await db('accounts')
    .where('id', id)
    .delete();

  res.json({ message: 'Account deleted successfully' });
};

export const getAccountBalance = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as any;
  const userId = authReq.user?.id;

  const balances = await db('accounts')
    .select(
      db.raw('COALESCE(SUM(balance), 0) as total_balance'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'checking\' THEN balance ELSE 0 END), 0) as checking'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'savings\' THEN balance ELSE 0 END), 0) as savings'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'credit_card\' THEN balance ELSE 0 END), 0) as credit_card'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'cash\' THEN balance ELSE 0 END), 0) as cash'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'investment\' THEN balance ELSE 0 END), 0) as investment'),
      db.raw('COALESCE(SUM(CASE WHEN type = \'loan\' THEN balance ELSE 0 END), 0) as loan')
    )
    .where('user_id', userId)
    .where('is_active', true)
    .first();

  res.json({ balances });
};
