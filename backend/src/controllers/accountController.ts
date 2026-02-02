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

interface AccountDetailsInput {
  credit_limit?: number;
  available_credit?: number;
  loan_amount?: number;
  loan_balance?: number;
  interest_rate?: number;
  loan_term_months?: number;
  loan_start_date?: string;
  loan_due_date?: string;
}

interface AccountInput {
  name: string;
  type: string;
  currency: string;
  institution_name?: string;
  balance?: number;
  is_active?: boolean;
  details?: AccountDetailsInput;
}

// Helper to build account response with details
const buildAccountResponse = (account: any, details?: any) => {
  const response: any = { ...account };
  if (details) {
    response.details = { ...details };
  }
  return response;
};

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { name, type, currency, institution_name, balance, details } = req.body as AccountInput;

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

    // Create account details if provided
    let accountDetails = null;
    if (details && (type === 'credit_card' || type === 'loan')) {
      const [detail] = await db('account_details')
        .insert({
          account_id: account.id,
          ...details,
        })
        .returning('*');
      accountDetails = detail;
    }

    res.status(201).json({ account: buildAccountResponse(account, accountDetails) });
  } catch (error) {
    handleError(next, error);
  }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { type, is_active } = req.query;

    let query = db('accounts')
      .select(
        'accounts.id',
        'accounts.user_id',
        'accounts.name',
        'accounts.type',
        'accounts.currency',
        'accounts.institution_name',
        'accounts.balance',
        'accounts.is_active',
        'accounts.created_at',
        'accounts.updated_at',
        'account_details.id as details_id',
        'account_details.credit_limit',
        'account_details.available_credit',
        'account_details.loan_amount',
        'account_details.loan_balance',
        'account_details.interest_rate',
        'account_details.loan_term_months',
        'account_details.loan_start_date',
        'account_details.loan_due_date',
        'account_details.created_at as details_created_at',
        'account_details.updated_at as details_updated_at'
      )
      .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
      .where('accounts.user_id', userId);

    if (type) {
      query = query.where('accounts.type', type);
    }
    if (is_active !== undefined) {
      query = query.where('accounts.is_active', is_active === 'true');
    }

    const accountsRaw = await query.orderBy('accounts.created_at', 'desc');

    // Group details with accounts
    const accounts = accountsRaw.reduce((acc: any[], row: any) => {
      const existing = acc.find(a => a.id === row.id);
      const details = row.details_id ? {
        id: row.details_id,
        account_id: row.id,
        credit_limit: row.credit_limit,
        available_credit: row.available_credit,
        loan_amount: row.loan_amount,
        loan_balance: row.loan_balance,
        interest_rate: row.interest_rate,
        loan_term_months: row.loan_term_months,
        loan_start_date: row.loan_start_date,
        loan_due_date: row.loan_due_date,
        created_at: row.details_created_at,
        updated_at: row.details_updated_at,
      } : null;
      
      if (existing) {
        if (details) {
          existing.details = details;
        }
      } else {
        const { details_id, credit_limit, available_credit, loan_amount, loan_balance, interest_rate, loan_term_months, loan_start_date, loan_due_date, details_created_at, details_updated_at, ...account } = row;
        acc.push(buildAccountResponse(account, details));
      }
      return acc;
    }, []);

    res.json({ accounts });
  } catch (error) {
    handleError(next, error);
  }
};

export const getAccountById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const result = await db('accounts')
      .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
      .where('accounts.id', id)
      .where('accounts.user_id', userId)
      .first();

    if (!result) {
      throw new AppError('Account not found', 404);
    }

    const { account_details, ...account } = result;
    res.json({ account: buildAccountResponse(account, account_details) });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { name, type, currency, institution_name, is_active, balance, details } = req.body as AccountInput;

    const account = await db('accounts')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (currency !== undefined) updateData.currency = currency;
    if (institution_name !== undefined) updateData.institution_name = institution_name;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (balance !== undefined) updateData.balance = balance;
    updateData.updated_at = db.fn.now();

    const [updatedAccount] = await db('accounts')
      .where('id', id)
      .update(updateData)
      .returning('*');

    // Update or create account details
    let accountDetails = null;
    if (details && (account.type === 'credit_card' || account.type === 'loan')) {
      const existingDetails = await db('account_details')
        .where('account_id', id)
        .first();

      if (existingDetails) {
        const [detail] = await db('account_details')
          .where('account_id', id)
          .update(details)
          .returning('*');
        accountDetails = detail;
      } else {
        const [detail] = await db('account_details')
          .insert({
            account_id: id,
            ...details,
          })
          .returning('*');
        accountDetails = detail;
      }
    }

    res.json({ account: buildAccountResponse(updatedAccount, accountDetails) });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
  } catch (error) {
    handleError(next, error);
  }
};

export const getAccountBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
  } catch (error) {
    handleError(next, error);
  }
};
