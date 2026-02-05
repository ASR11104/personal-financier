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

// Helper function to get investment with related data
const getInvestmentWithDetails = async (investmentId: string): Promise<any> => {
  const investment = await db('investments')
    .select(
      'investments.*',
      'investment_types.name as investment_type_name',
      'accounts.name as account_name'
    )
    .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
    .leftJoin('accounts', 'investments.account_id', 'accounts.id')
    .where('investments.id', investmentId)
    .first();

  return investment;
};

// Helper function to get SIP transactions for an investment
const getSipTransactions = async (investmentId: string): Promise<any[]> => {
  const transactions = await db('sip_transactions')
    .select('*')
    .where('investment_id', investmentId)
    .orderBy('transaction_date', 'desc');
  return transactions;
};

export const createInvestment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { 
      account_id, 
      investment_type_id, 
      name, 
      amount, 
      units, 
      purchase_price, 
      purchase_date, 
      description,
      // SIP fields
      is_sip,
      sip_amount,
      sip_frequency,
      sip_start_date,
      sip_end_date,
      sip_day_of_month,
      sip_total_installments,
      // Existing investment flag - skips account balance deduction
      is_existing,
    } = req.body;

    // Validate account exists and belongs to user (only required for new investments)
    if (account_id) {
      const account = await db('accounts')
        .where('id', account_id)
        .where('user_id', userId)
        .first();

      if (!account) {
        throw new AppError('Account not found', 404);
      }
    }

    // Validate investment type exists
    const investmentType = await db('investment_types')
      .where('id', investment_type_id)
      .first();

    if (!investmentType) {
      throw new AppError('Investment type not found', 404);
    }

    // For SIP investments, use sip_start_date as purchase_date
    const effectivePurchaseDate = is_sip ? sip_start_date : purchase_date;

    // For SIP, amount defaults to sip_amount if not provided (for initial lump sum)
    const investmentAmount = amount || sip_amount || 0;

    // Create investment record
    const [investment] = await db('investments')
      .insert({
        user_id: userId,
        account_id: account_id || null,
        investment_type_id,
        name,
        amount: investmentAmount,
        units: units || null,
        purchase_price: purchase_price || null,
        purchase_date: effectivePurchaseDate,
        description: description || null,
        // SIP fields
        is_sip: is_sip || false,
        sip_amount: sip_amount || null,
        sip_frequency: sip_frequency || null,
        sip_start_date: sip_start_date || null,
        sip_end_date: sip_end_date || null,
        sip_day_of_month: sip_day_of_month || null,
        sip_total_installments: sip_total_installments || null,
      })
      .returning('*');

    // For non-SIP investments or SIP with initial lump sum, create ledger entry
    // Skip if this is an existing investment (no account balance change needed)
    if (!is_existing && !is_sip && investmentAmount) {
      // Create ledger entry (negative amount for money going out)
      await db('ledger_entries').insert({
        account_id,
        investment_id: investment.id,
        amount: -Number(investmentAmount),
      });

      // Update account balance (decrease for investment purchase)
      await db('accounts')
        .where('id', account_id)
        .decrement('balance', investmentAmount);
    }

    // If it's an SIP with initial lump sum and NOT an existing investment, create the first transaction
    // For existing SIPs, we don't want to deduct money from accounts
    if (!is_existing && is_sip && sip_amount) {
      // Process the first SIP transaction
      await processSipTransaction(investment.id, effectivePurchaseDate);
    }

    // Get investment with details for response
    const investmentWithDetails = await getInvestmentWithDetails(investment.id);

    res.status(201).json({ investment: investmentWithDetails });
  } catch (error) {
    handleError(next, error);
  }
};

// Helper function to process an SIP transaction
const processSipTransaction = async (investmentId: string, transactionDate: string): Promise<void> => {
  const investment = await db('investments')
    .where('id', investmentId)
    .first();

  if (!investment || !investment.is_sip) return;

  // Check if we've reached the total installments limit
  if (investment.sip_total_installments && 
      investment.sip_installments_completed >= investment.sip_total_installments) {
    return;
  }

  // Check if SIP has ended
  if (investment.sip_end_date && new Date(transactionDate) > new Date(investment.sip_end_date)) {
    return;
  }

  // Create SIP transaction
  await db('sip_transactions').insert({
    investment_id: investmentId,
    account_id: investment.account_id,
    amount: investment.sip_amount,
    transaction_date: transactionDate,
    status: 'completed',
    processed_at: new Date(),
  });

  // Update investment installment count
  await db('investments')
    .where('id', investmentId)
    .increment('sip_installments_completed', 1);

  // Update account balance
  await db('accounts')
    .where('id', investment.account_id)
    .decrement('balance', investment.sip_amount);

  // Create ledger entry
  await db('ledger_entries').insert({
    account_id: investment.account_id,
    investment_id: investmentId,
    amount: -Number(investment.sip_amount),
  });
};

export const getInvestments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { 
      start_date, 
      end_date, 
      investment_type_id, 
      account_id, 
      status,
      is_sip,
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = db('investments')
      .select(
        'investments.*',
        'investment_types.name as investment_type_name',
        'accounts.name as account_name'
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .leftJoin('accounts', 'investments.account_id', 'accounts.id')
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at');

    if (start_date) {
      query = query.where('investments.purchase_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('investments.purchase_date', '<=', end_date);
    }
    if (investment_type_id) {
      query = query.where('investments.investment_type_id', investment_type_id);
    }
    if (account_id) {
      query = query.where('investments.account_id', account_id);
    }
    if (status) {
      query = query.where('investments.status', status);
    }
    if (is_sip !== undefined) {
      query = query.where('investments.is_sip', is_sip === 'true');
    }

    const investments = await query
      .orderBy('investments.purchase_date', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    // Get SIP transaction counts for each investment
    const investmentsWithSipInfo = await Promise.all(
      investments.map(async (inv) => {
        const sipTransactions = await getSipTransactions(inv.id);
        const currentAmount = Number(inv.amount) - Number(inv.withdrawal_amount || 0);
        return { 
          ...inv, 
          sip_transactions_count: sipTransactions.length,
          current_amount: currentAmount,
        };
      })
    );

    res.json({ investments: investmentsWithSipInfo });
  } catch (error) {
    handleError(next, error);
  }
};

export const getInvestmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const investment = await db('investments')
      .select(
        'investments.*',
        'investment_types.name as investment_type_name',
        'investment_types.description as investment_type_description',
        'accounts.name as account_name',
        'accounts.type as account_type'
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .leftJoin('accounts', 'investments.account_id', 'accounts.id')
      .where('investments.id', id)
      .where('investments.user_id', userId)
      .first();

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Get SIP transactions if applicable
    let sipTransactions = [];
    if (investment.is_sip) {
      sipTransactions = await getSipTransactions(id);
    }

    res.json({ investment: { ...investment, sip_transactions: sipTransactions } });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateInvestment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { 
      name, 
      amount, 
      units, 
      purchase_price, 
      purchase_date, 
      description,
      investment_type_id,
      // SIP fields
      is_sip,
      sip_amount,
      sip_frequency,
      sip_start_date,
      sip_end_date,
      sip_day_of_month,
      sip_total_installments,
    } = req.body;

    const investment = await db('investments')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Only allow updates if investment is still active
    if (investment.status !== 'active') {
      throw new AppError('Cannot update investment that is not active', 400);
    }

    // Revert the old ledger entry and account balance (only for non-SIP with account_id)
    if (!investment.is_sip && investment.account_id) {
      await db('ledger_entries')
        .where('investment_id', id)
        .delete();

      await db('accounts')
        .where('id', investment.account_id)
        .increment('balance', investment.amount);
    }

    // Update investment
    const [updatedInvestment] = await db('investments')
      .where('id', id)
      .update({
        name: name || investment.name,
        amount: amount !== undefined ? amount : investment.amount,
        units: units !== undefined ? units : investment.units,
        purchase_price: purchase_price !== undefined ? purchase_price : investment.purchase_price,
        purchase_date: purchase_date || investment.purchase_date,
        description: description !== undefined ? description : investment.description,
        investment_type_id: investment_type_id || investment.investment_type_id,
        // SIP fields
        is_sip: is_sip !== undefined ? is_sip : investment.is_sip,
        sip_amount: sip_amount !== undefined ? sip_amount : investment.sip_amount,
        sip_frequency: sip_frequency || investment.sip_frequency,
        sip_start_date: sip_start_date || investment.sip_start_date,
        sip_end_date: sip_end_date || investment.sip_end_date,
        sip_day_of_month: sip_day_of_month || investment.sip_day_of_month,
        sip_total_installments: sip_total_installments || investment.sip_total_installments,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // For non-SIP investments with account_id, create new ledger entry with updated amount
    if (!updatedInvestment.is_sip && updatedInvestment.account_id) {
      await db('ledger_entries').insert({
        account_id: updatedInvestment.account_id,
        investment_id: updatedInvestment.id,
        amount: -Number(updatedInvestment.amount),
      });

      await db('accounts')
        .where('id', updatedInvestment.account_id)
        .decrement('balance', updatedInvestment.amount);
    }

    // Get investment with details for response
    const investmentWithDetails = await getInvestmentWithDetails(updatedInvestment.id);

    res.json({ investment: investmentWithDetails });
  } catch (error) {
    handleError(next, error);
  }
};

export const deleteInvestment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;

    const investment = await db('investments')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    // Soft delete
    await db('investments')
      .where('id', id)
      .update({
        deleted_at: db.fn.now(),
      });

    // Revert account balance (add back the investment amount for non-SIP)
    if (!investment.is_sip) {
      await db('accounts')
        .where('id', investment.account_id)
        .increment('balance', investment.amount);
    }

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    handleError(next, error);
  }
};

export const processSipPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { transaction_date } = req.body;

    const investment = await db('investments')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    if (!investment.is_sip) {
      throw new AppError('This investment is not an SIP', 400);
    }

    if (investment.status !== 'active') {
      throw new AppError('Investment is not active', 400);
    }

    const date = transaction_date || new Date().toISOString().split('T')[0];

    await processSipTransaction(id, date);

    const updatedInvestment = await getInvestmentWithDetails(id);
    const sipTransactions = await getSipTransactions(id);

    res.json({ 
      message: 'SIP payment processed successfully',
      investment: { ...updatedInvestment, sip_transactions: sipTransactions }
    });
  } catch (error) {
    handleError(next, error);
  }
};

export const withdrawInvestment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { 
      target_account_id, 
      withdrawal_amount, 
      withdrawal_date, 
      description 
    } = req.body;

    const investment = await db('investments')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!investment) {
      throw new AppError('Investment not found', 404);
    }

    if (investment.status !== 'active') {
      throw new AppError('Investment is not active', 400);
    }

    // Validate target account
    const targetAccount = await db('accounts')
      .where('id', target_account_id)
      .where('user_id', userId)
      .first();

    if (!targetAccount) {
      throw new AppError('Target account not found', 404);
    }

    const withdrawAmount = Number(withdrawal_amount) || investment.amount;
    const withdrawDate = withdrawal_date || new Date().toISOString().split('T')[0];

    // Calculate remaining amount after withdrawal
    const currentWithdrawalAmount = Number(investment.withdrawal_amount || 0);
    const remainingAmount = Number(investment.amount) - currentWithdrawalAmount;
    const actualWithdrawalAmount = Math.min(withdrawAmount, remainingAmount);

    // Check if this is a full or partial withdrawal
    const isFullWithdrawal = actualWithdrawalAmount >= remainingAmount;

    // Find or create an "Investment" category for the user
    let investmentCategory = await db('categories')
      .where('name', 'Investment')
      .where('user_id', userId)
      .first();

    if (!investmentCategory) {
      // Try to find any income category for the user
      const anyIncomeCategory = await db('categories')
        .where('type', 'income')
        .where('user_id', userId)
        .first();

      if (anyIncomeCategory) {
        investmentCategory = anyIncomeCategory;
      } else {
        // Create a new Investment category for the user
        const [newCategory] = await db('categories')
          .insert({
            name: 'Investment',
            type: 'income',
            description: 'Investment income',
            user_id: userId,
          })
          .returning('*');
        investmentCategory = newCategory;
      }
    }

    // Create income record for the withdrawal
    const [income] = await db('incomes')
      .insert({
        user_id: userId,
        account_id: target_account_id,
        category_id: investmentCategory.id,
        amount: actualWithdrawalAmount,
        description: description || `Withdrawal from ${investment.name}`,
        income_date: withdrawDate,
      })
      .returning('*');

    // Update investment - track withdrawal amount and optionally mark as withdrawn
    const newWithdrawalAmount = currentWithdrawalAmount + actualWithdrawalAmount;
    await db('investments')
      .where('id', id)
      .update({
        withdrawal_amount: newWithdrawalAmount,
        status: isFullWithdrawal ? 'withdrawn' : 'active',
        updated_at: db.fn.now(),
      });

    // Update target account balance (increase)
    await db('accounts')
      .where('id', target_account_id)
      .increment('balance', actualWithdrawalAmount);

    // Create ledger entries
    await db('ledger_entries').insert({
      account_id: target_account_id,
      income_id: income.id,
      amount: actualWithdrawalAmount,
    });

    // Get updated investment
    const updatedInvestment = await getInvestmentWithDetails(id);
    const currentAmount = Number(updatedInvestment.amount) - Number(updatedInvestment.withdrawal_amount || 0);

    res.json({ 
      message: isFullWithdrawal ? 'Investment withdrawn successfully' : 'Partial withdrawal processed successfully',
      income: {
        ...income,
        account_name: targetAccount.name,
      },
      investment: {
        ...updatedInvestment,
        current_amount: currentAmount,
      }
    });
  } catch (error) {
    handleError(next, error);
  }
};

export const getInvestmentSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date } = req.query;

    let baseQuery = db('investments')
      .where('user_id', userId)
      .whereNull('deleted_at');

    if (start_date) {
      baseQuery = baseQuery.where('purchase_date', '>=', start_date);
    }
    if (end_date) {
      baseQuery = baseQuery.where('purchase_date', '<=', end_date);
    }

    // Get total investments
    const totalQuery = await baseQuery.clone()
      .select(
        db.raw('COUNT(*) as total_count'),
        db.raw('COALESCE(SUM(amount), 0) as total_amount')
      )
      .first();

    // Get breakdown by investment type
    const byType = await db('investments')
      .select(
        'investment_types.name as investment_type',
        db.raw('COALESCE(SUM(investments.amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at')
      .groupBy('investment_types.name')
      .orderBy('total', 'desc');

    // Get breakdown by status
    const byStatus = await db('investments')
      .select(
        'status',
        db.raw('COUNT(*) as count'),
        db.raw('COALESCE(SUM(amount), 0) as total')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .groupBy('status');

    // Get SIP summary
    const sipSummary = await db('investments')
      .select(
        db.raw('COUNT(*) as total_sips'),
        db.raw('COALESCE(SUM(sip_amount), 0) as total_sip_amount'),
        db.raw('COALESCE(SUM(sip_installments_completed), 0) as total_installments')
      )
      .where('user_id', userId)
      .where('is_sip', true)
      .whereNull('deleted_at')
      .first();

    res.json({
      summary: {
        total_count: totalQuery.total_count,
        total_amount: totalQuery.total_amount,
      },
      by_type: byType,
      by_status: byStatus,
      sip_summary: sipSummary,
    });
  } catch (error) {
    handleError(next, error);
  }
};

export const getInvestmentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const investmentTypes = await db('investment_types')
      .select('*')
      .orderBy('name', 'asc');

    res.json({ investment_types: investmentTypes });
  } catch (error) {
    handleError(next, error);
  }
};
