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

interface AccountDetailsInput {
  credit_limit?: number;
  available_credit?: number;
  loan_amount?: number;
  loan_balance?: number;
  interest_rate?: number;
  loan_term_months?: number;
  loan_start_date?: string;
  loan_due_date?: string;
  current_monthly_payment?: number;
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
        // For credit cards and loans, balance is always 0 - use account_details instead
        balance: ['credit_card', 'loan'].includes(type) ? 0 : (balance || 0),
      })
      .returning('*');

    // Create account details if provided
    let accountDetails = null;
    if (type === 'credit_card') {
      const creditLimit = details?.credit_limit || 0;
      const [detail] = await db('account_details')
        .insert({
          account_id: account.id,
          credit_limit: creditLimit,
          available_credit: creditLimit,
        })
        .returning('*');
      accountDetails = detail;

      // Create tag for this credit card (independent tag, not under category)
      const existingTag = await db('tags')
        .where('user_id', userId)
        .where('name', name)
        .first();

      if (!existingTag) {
        await db('tags').insert({
          user_id: userId,
          name: name,
          color: '#3B82F6', // Default blue color
        });
      }
    } else if (details && type === 'loan') {
      const [detail] = await db('account_details')
        .insert({
          account_id: account.id,
          ...details,
        })
        .returning('*');
      accountDetails = detail;

      // Create tag for this loan (independent tag, not under category)
      const existingTag = await db('tags')
        .where('user_id', userId)
        .where('name', name)
        .first();

      if (!existingTag) {
        await db('tags').insert({
          user_id: userId,
          name: name,
          color: '#EF4444', // Red color for loans
        });
      }
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
        'account_details.current_monthly_payment',
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
        current_monthly_payment: row.current_monthly_payment,
        created_at: row.details_created_at,
        updated_at: row.details_updated_at,
      } : null;
      
      if (existing) {
        if (details) {
          existing.details = details;
        }
      } else {
        const { details_id, credit_limit, available_credit, loan_amount, loan_balance, interest_rate, loan_term_months, loan_start_date, loan_due_date, current_monthly_payment, details_created_at, details_updated_at, ...account } = row;
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
        'account_details.current_monthly_payment',
        'account_details.created_at as details_created_at',
        'account_details.updated_at as details_updated_at'
      )
      .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
      .where('accounts.id', id)
      .where('accounts.user_id', userId)
      .first();

    if (!result) {
      throw new AppError('Account not found', 404);
    }

    const { details_id, credit_limit, available_credit, loan_amount, loan_balance, interest_rate, loan_term_months, loan_start_date, loan_due_date, current_monthly_payment, details_created_at, details_updated_at, ...account } = result;
    
    const details = details_id ? {
      id: details_id,
      account_id: id,
      credit_limit,
      available_credit,
      loan_amount,
      loan_balance,
      interest_rate,
      loan_term_months,
      loan_start_date,
      loan_due_date,
      current_monthly_payment,
      created_at: details_created_at,
      updated_at: details_updated_at,
    } : null;

    res.json({ account: buildAccountResponse(account, details) });
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
    updateData.updated_at = db.fn.now();

    // Determine effective type (use new type if provided, otherwise use current)
    const effectiveType = type || account.type;
    // For credit cards and loans, do not allow balance updates - use account_details instead
    if (balance !== undefined && !['credit_card', 'loan'].includes(effectiveType)) {
      updateData.balance = balance;
    }
    updateData.updated_at = db.fn.now();

    const [updatedAccount] = await db('accounts')
      .where('id', id)
      .update(updateData)
      .returning('*');

    let accountDetails = null;
    if (details && effectiveType === 'credit_card') {
      const existingDetails = await db('account_details')
        .where('account_id', id)
        .first();

      if (existingDetails) {
        // Build update object for credit card details
        const detailsUpdate: any = { ...details };
        
        // When credit_limit is updated without explicitly setting available_credit,
        // recalculate available_credit based on current balance
        if (details.credit_limit !== undefined && details.available_credit === undefined) {
          const currentBalance = updatedAccount.balance || 0;
          detailsUpdate.available_credit = details.credit_limit - currentBalance;
        }
        
        const [detail] = await db('account_details')
          .where('account_id', id)
          .update(detailsUpdate)
          .returning('*');
        accountDetails = detail;
      } else {
        // Create new details with available_credit equal to credit_limit
        const creditLimit = details?.credit_limit || 0;
        const [detail] = await db('account_details')
          .insert({
            account_id: id,
            credit_limit: creditLimit,
            available_credit: details?.available_credit ?? creditLimit,
          })
          .returning('*');
        accountDetails = detail;
      }
    } else if (details && effectiveType === 'loan') {
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

    // Update tag name if account name changed
    if (name && (account.type === 'credit_card' || account.type === 'loan')) {
      await db('tags')
        .where('user_id', userId)
        .where('name', account.name)
        .update('name', name);
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

    // Soft delete - set is_active to false instead of hard deleting
    // This preserves historical expense data
    await db('accounts')
      .where('id', id)
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};

export const reactivateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Reactivate a soft-deleted account
    await db('accounts')
      .where('id', id)
      .update({
        is_active: true,
        updated_at: db.fn.now(),
      });

    const updatedAccount = await db('accounts')
      .where('id', id)
      .first();

    res.json({ account: updatedAccount, message: 'Account reactivated successfully' });
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
        db.raw('COALESCE(SUM(CASE WHEN type IN (\'checking\', \'savings\', \'cash\') THEN balance ELSE 0 END), 0) as total_balance'),
        db.raw('COALESCE(SUM(CASE WHEN type = \'checking\' THEN balance ELSE 0 END), 0) as checking'),
        db.raw('COALESCE(SUM(CASE WHEN type = \'savings\' THEN balance ELSE 0 END), 0) as savings'),
        db.raw(`COALESCE(SUM(CASE WHEN type = 'credit_card' THEN COALESCE(account_details.credit_limit - account_details.available_credit, 0) ELSE 0 END), 0) as credit_card`),
        db.raw('COALESCE(SUM(CASE WHEN type = \'cash\' THEN balance ELSE 0 END), 0) as cash'),
        db.raw('COALESCE(SUM(CASE WHEN type = \'investment\' THEN balance ELSE 0 END), 0) as investment'),
        db.raw(`COALESCE(SUM(CASE WHEN type = 'loan' THEN COALESCE(account_details.loan_balance, 0) ELSE 0 END), 0) as loan`)
      )
      .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
      .where('user_id', userId)
      .where('is_active', true)
      .first();

    res.json({ balances });
  } catch (error) {
    handleError(next, error);
  }
};
