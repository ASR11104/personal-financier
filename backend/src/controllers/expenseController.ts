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

// Helper function to get the target credit card account for bill payments
const getTargetCreditCardAccount = async (userId: string, creditCardAccountId: string): Promise<any | null> => {
  if (!creditCardAccountId) return null;

  const creditCardAccount = await db('accounts')
    .where('id', creditCardAccountId)
    .where('type', 'credit_card')
    .where('user_id', userId)
    .first();

  return creditCardAccount;
};

// Helper function to update credit card balance and available_credit for bill payments
const updateCreditCardBillPayment = async (
  userId: string,
  accountId: string,
  amount: number,
  isRevert: boolean,
  creditCardAccountId?: string
): Promise<void> => {
  const direction = isRevert ? -1 : 1;
  const adjustedAmount = amount * direction;

  // Decrease the source account balance
  await db('accounts')
    .where('id', accountId)
    .decrement('balance', adjustedAmount);

  // If we have a credit_card_account_id, decrease the target credit card's balance and increase available_credit
  if (creditCardAccountId) {
    const creditCardAccount = await getTargetCreditCardAccount(userId, creditCardAccountId);
    if (creditCardAccount) {
      await db('account_details')
        .where('account_id', creditCardAccount.id)
        .increment('available_credit', adjustedAmount);
    }
  }
};

// Helper function to check if an expense is a credit card bill payment
const isCreditCardBillPayment = async (categoryId: string, creditCardAccountId?: string): Promise<boolean> => {
  if (!creditCardAccountId) return false;

  const category = await db('categories')
    .where('id', categoryId)
    .first();

  return category?.name === 'Credit Card';
};

// Helper function to get the target loan account for loan payments
const getTargetLoanAccount = async (userId: string, loanAccountId: string): Promise<any | null> => {
  if (!loanAccountId) return null;

  const loanAccount = await db('accounts')
    .where('id', loanAccountId)
    .where('type', 'loan')
    .where('user_id', userId)
    .first();

  return loanAccount;
};

// Helper function to check if an expense is a loan payment
const isLoanPayment = async (categoryId: string, loanAccountId?: string): Promise<boolean> => {
  if (!loanAccountId) return false;

  const category = await db('categories')
    .where('id', categoryId)
    .first();

  return category?.name === 'Loan';
};

// Helper function to get the payment month (YYYYMM format) from a date
const getPaymentMonth = (dateStr: string): number => {
  const date = new Date(dateStr);
  return date.getFullYear() * 100 + (date.getMonth() + 1);
};

// Helper function to calculate monthly interest for a loan
const calculateMonthlyInterest = async (loanAccountId: string): Promise<number> => {
  const accountDetails = await db('account_details')
    .where('account_id', loanAccountId)
    .first();

  if (!accountDetails || !accountDetails.interest_rate || !accountDetails.loan_balance) {
    return 0;
  }

  // Monthly interest = (annual interest rate / 12) * current balance
  // interest_rate is stored as annual percentage (e.g., 5.00 for 5%)
  const annualRate = parseFloat(accountDetails.interest_rate.toString());
  const monthlyRate = annualRate / 100 / 12;
  const balance = parseFloat(accountDetails.loan_balance.toString());

  return Number((monthlyRate * balance).toFixed(2));
};

// Helper function to get total interest paid in a month for a loan
const getMonthlyInterestPaid = async (loanAccountId: string, paymentDate: string): Promise<number> => {
  const paymentMonth = getPaymentMonth(paymentDate);

  const result = await db('loan_payment_schedule')
    .where('account_id', loanAccountId)
    .where('payment_month', paymentMonth)
    .sum('interest_amount as total_interest')
    .first();

  return result?.total_interest || 0;
};

// Helper function to process loan payment with interest/principal split
const processLoanPayment = async (
  userId: string,
  loanAccountId: string,
  paymentAmount: number,
  paymentDate: string,
  expenseId?: string
): Promise<{ interestAmount: number; principalAmount: number }> => {
  // Calculate the total interest that needs to be paid for this month
  const monthlyInterest = await calculateMonthlyInterest(loanAccountId);

  // Get how much interest has already been paid this month
  const interestPaidThisMonth = await getMonthlyInterestPaid(loanAccountId, paymentDate);

  // Calculate remaining interest to pay
  const remainingInterest = Math.max(0, monthlyInterest - interestPaidThisMonth);

  if (paymentAmount < remainingInterest) {
    // Payment doesn't cover remaining interest - entire amount goes to interest
    // Record in payment schedule
    const paymentMonth = getPaymentMonth(paymentDate);
    await db('loan_payment_schedule').insert({
      account_id: loanAccountId,
      expense_id: expenseId || null,
      payment_amount: paymentAmount,
      interest_amount: paymentAmount,
      principal_amount: 0,
      payment_date: paymentDate,
      payment_month: paymentMonth,
    });

    return { interestAmount: paymentAmount, principalAmount: 0 };
  }

  // Payment covers remaining interest - apply remaining interest first, rest to principal
  const principalAmount = paymentAmount - remainingInterest;

  // Update loan balances (only principal reduces the loan balance)
  await db('account_details')
    .where('account_id', loanAccountId)
    .decrement('loan_balance', principalAmount);

  // Record in payment schedule
  const paymentMonth = getPaymentMonth(paymentDate);
  await db('loan_payment_schedule').insert({
    account_id: loanAccountId,
    expense_id: expenseId || null,
    payment_amount: paymentAmount,
    interest_amount: remainingInterest,
    principal_amount: principalAmount,
    payment_date: paymentDate,
    payment_month: paymentMonth,
  });

  return { interestAmount: remainingInterest, principalAmount };
};

// Helper function to revert a loan payment
const revertLoanPayment = async (
  loanAccountId: string,
  expenseId: string
): Promise<void> => {
  // Find the payment record
  const paymentRecord = await db('loan_payment_schedule')
    .where('expense_id', expenseId)
    .first();

  if (!paymentRecord) {
    // No payment record found, nothing to revert
    return;
  }

  // Only increment loan_balance by principal amount (interest doesn't reduce principal)
  await db('account_details')
    .where('account_id', loanAccountId)
    .increment('loan_balance', paymentRecord.principal_amount);

  // Delete the payment record
  await db('loan_payment_schedule')
    .where('id', paymentRecord.id)
    .delete();
};

// Helper function to update loan balance for loan payments
const updateLoanPayment = async (
  userId: string,
  accountId: string,
  amount: number,
  isRevert: boolean,
  loanAccountId?: string,
  expenseId?: string,
  paymentDate?: string
): Promise<void> => {
  const direction = isRevert ? -1 : 1;
  const adjustedAmount = amount * direction;

  // Decrease the source account balance (checking, savings, etc.)
  await db('accounts')
    .where('id', accountId)
    .decrement('balance', adjustedAmount);

  // If we have a loan_account_id, process the loan payment
  if (loanAccountId && !isRevert) {
    const loanAccount = await getTargetLoanAccount(userId, loanAccountId);
    if (loanAccount) {
      await processLoanPayment(
        userId,
        loanAccount.id,
        amount,
        paymentDate || new Date().toISOString(),
        expenseId
      );
    }
  } else if (loanAccountId && isRevert) {
    // Revert the loan payment
    const loanAccount = await getTargetLoanAccount(userId, loanAccountId);
    if (loanAccount && expenseId) {
      await revertLoanPayment(loanAccount.id, expenseId);
    }
  }
};

// Helper function to get tags for an expense
const getExpenseTags = async (expenseId: string): Promise<any[]> => {
  const tags = await db('expense_tags')
    .select('tags.*')
    .join('tags', 'expense_tags.tag_id', 'tags.id')
    .where('expense_tags.expense_id', expenseId);

  return tags;
};

// Helper function to link tags to an expense
const linkTagsToExpense = async (expenseId: string, tagIds: string[]): Promise<void> => {
  if (!tagIds || tagIds.length === 0) return;

  const expenseTags = tagIds.map((tagId) => ({
    expense_id: expenseId,
    tag_id: tagId,
  }));

  await db('expense_tags').insert(expenseTags);
}

// Helper function to unlink all tags from an expense
const unlinkTagsFromExpense = async (expenseId: string): Promise<void> => {
  await db('expense_tags').where('expense_id', expenseId).delete();
};

// Helper function to revert loan payment by expense ID
const revertLoanPaymentByExpenseId = async (loanAccountId: string, expenseId: string): Promise<void> => {
  const paymentRecord = await db('loan_payment_schedule')
    .where('expense_id', expenseId)
    .first();

  if (!paymentRecord) return;

  // Reverse the balances
  await db('account_details')
    .where('account_id', paymentRecord.account_id)
    .increment('loan_balance', paymentRecord.principal_amount);

  // Delete the payment record
  await db('loan_payment_schedule')
    .where('id', paymentRecord.id)
    .delete();
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { account_id, category_id, amount, description, expense_date, tag_ids, credit_card_account_id, loan_account_id } = req.body;

    // Get account type to determine how to update
    const account = await db('accounts').where('id', account_id).first();
    if (!account) {
      throw new AppError('Account not found', 404);
    }

    // Get category to check if it's a credit card bill payment
    const category = await db('categories').where('id', category_id).first();

    const [expense] = await db('expenses')
      .insert({
        user_id: userId,
        account_id,
        category_id,
        amount,
        description,
        expense_date,
        credit_card_account_id: credit_card_account_id || null,
        loan_account_id: loan_account_id || null,
      })
      .returning('*');

    // Link tags to expense
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      await linkTagsToExpense(expense.id, tag_ids);
    }

    // Create ledger entry
    await db('ledger_entries').insert({
      account_id,
      expense_id: expense.id,
      amount: -amount,
    });

    // Update account balance or available_credit based on account type and category
    if (category.name === 'Credit Card' && credit_card_account_id) {
      // Credit card bill payment - decrease credit card balance and increase available_credit on the target credit card
      const creditCardAccount = await getTargetCreditCardAccount(userId, credit_card_account_id);

      if (creditCardAccount) {
        await db('account_details')
          .where('account_id', creditCardAccount.id)
          .increment('available_credit', amount);
      }

      // Also decrease the balance of the source account
      await db('accounts')
        .where('id', account_id)
        .decrement('balance', amount);
    } else if (category.name === 'Loan' && loan_account_id) {
      // Loan payment with interest/principal split
      const loanAccount = await getTargetLoanAccount(userId, loan_account_id);

      if (loanAccount) {
        await processLoanPayment(
          userId,
          loanAccount.id,
          amount,
          expense_date,
          expense.id
        );
      }

      // Also decrease the balance of the source account
      await db('accounts')
        .where('id', account_id)
        .decrement('balance', amount);
    } else if (account.type === 'credit_card') {
      // Regular credit card purchase - increase balance and decrease available_credit
      await db('accounts')
        .where('id', account_id)
        .increment('balance', amount);
      await db('account_details')
        .where('account_id', account_id)
        .decrement('available_credit', amount);
    } else if (account.type === 'loan') {
      // Loan expense - increase loan balance (amount owed on the loan)
      await db('account_details')
        .where('account_id', account_id)
        .increment('loan_balance', amount);
    } else {
      // For other accounts, decrease balance
      await db('accounts')
        .where('id', account_id)
        .decrement('balance', amount);
    }

    // Get tags for the response
    const tags = await getExpenseTags(expense.id);

    res.status(201).json({ expense: { ...expense, tags } });
  } catch (error) {
    handleError(next, error);
  }
};

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { start_date, end_date, category_id, account_id, tag_id, limit = 50, offset = 0 } = req.query;

    let query = db('expenses')
      .select(
        'expenses.*',
        'categories.name as category_name',
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
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

    // Get tags for each expense
    const expensesWithTags = await Promise.all(
      expenses.map(async (expense) => {
        const tags = await getExpenseTags(expense.id);
        return { ...expense, tags };
      })
    );

    res.json({ expenses: expensesWithTags });
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
        'accounts.name as account_name'
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('accounts', 'expenses.account_id', 'accounts.id')
      .where('expenses.id', id)
      .where('expenses.user_id', userId)
      .first();

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    // Get tags for the expense
    const tags = await getExpenseTags(expense.id);

    res.json({ expense: { ...expense, tags } });
  } catch (error) {
    handleError(next, error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { id } = req.params;
    const { amount, description, expense_date, category_id, tag_ids, credit_card_account_id, loan_account_id } = req.body;

    const expense = await db('expenses')
      .where('id', id)
      .where('user_id', userId)
      .first();

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    // Get account type to determine how to update
    const account = await db('accounts').where('id', expense.account_id).first();

    // Check if old expense was a credit card bill payment or loan payment
    const wasBillPayment = await isCreditCardBillPayment(expense.category_id, expense.credit_card_account_id);
    const wasLoanPayment = await isLoanPayment(expense.category_id, expense.loan_account_id);

    // Revert old ledger entry and update account balance
    await db('ledger_entries')
      .where('expense_id', id)
      .delete();

    // Revert the old amount based on account type
    if (wasBillPayment) {
      await updateCreditCardBillPayment(userId, expense.account_id, expense.amount, true, expense.credit_card_account_id);
    } else if (wasLoanPayment) {
      await revertLoanPaymentByExpenseId(expense.loan_account_id, id);
      // Increase source account balance
      await db('accounts')
        .where('id', expense.account_id)
        .increment('balance', expense.amount);
    } else if (account.type === 'credit_card') {
      await db('accounts')
        .where('id', expense.account_id)
        .increment('available_credit', expense.amount);
    } else if (account.type === 'loan') {
      // Revert loan balance
      await db('account_details')
        .where('account_id', expense.account_id)
        .decrement('loan_balance', expense.amount);
    } else {
      await db('accounts')
        .where('id', expense.account_id)
        .increment('balance', expense.amount);
    }

    // Update expense
    const [updatedExpense] = await db('expenses')
      .where('id', id)
      .update({
        amount: amount !== undefined ? amount : expense.amount,
        description: description !== undefined ? description : expense.description,
        expense_date: expense_date || expense.expense_date,
        category_id: category_id || expense.category_id,
        credit_card_account_id: credit_card_account_id !== undefined ? credit_card_account_id : expense.credit_card_account_id,
        loan_account_id: loan_account_id !== undefined ? loan_account_id : expense.loan_account_id,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Update tags if provided
    if (tag_ids !== undefined) {
      await unlinkTagsFromExpense(id);
      if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
        await linkTagsToExpense(id, tag_ids);
      }
    }

    // Create new ledger entry and update account balance
    await db('ledger_entries').insert({
      account_id: expense.account_id,
      expense_id: updatedExpense.id,
      amount: -updatedExpense.amount,
    });

    // Check if new expense is a credit card bill payment or loan payment
    const newCategoryId = category_id || expense.category_id;
    const newCreditCardAccountId = credit_card_account_id !== undefined ? credit_card_account_id : expense.credit_card_account_id;
    const newLoanAccountId = loan_account_id !== undefined ? loan_account_id : expense.loan_account_id;
    const isNewBillPayment = await isCreditCardBillPayment(newCategoryId, newCreditCardAccountId);
    const isNewLoanPayment = await isLoanPayment(newCategoryId, newLoanAccountId);

    // Apply the new amount based on account type
    if (isNewBillPayment) {
      await updateCreditCardBillPayment(userId, expense.account_id, updatedExpense.amount, false, newCreditCardAccountId);
    } else if (isNewLoanPayment) {
      const loanAccount = await getTargetLoanAccount(userId, newLoanAccountId);

      if (loanAccount) {
        await processLoanPayment(
          userId,
          loanAccount.id,
          updatedExpense.amount,
          updatedExpense.expense_date,
          updatedExpense.id
        );
      }

      // Decrease source account balance
      await db('accounts')
        .where('id', expense.account_id)
        .decrement('balance', updatedExpense.amount);
    } else if (account.type === 'credit_card') {
      // For credit cards, use available_credit only (no balance update)
      await db('account_details')
        .where('account_id', expense.account_id)
        .decrement('available_credit', updatedExpense.amount);
    } else if (account.type === 'loan') {
      // For loans, use loan_balance only (no balance update)
      await db('account_details')
        .where('account_id', expense.account_id)
        .increment('loan_balance', updatedExpense.amount);
    } else {
      await db('accounts')
        .where('id', expense.account_id)
        .decrement('balance', updatedExpense.amount);
    }

    // Get tags for the response
    const tags = await getExpenseTags(updatedExpense.id);

    res.json({ expense: { ...updatedExpense, tags } });
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

    // Get account type to determine how to update
    const account = await db('accounts').where('id', expense.account_id).first();

    // Check if this was a credit card bill payment or loan payment
    const isBillPayment = await isCreditCardBillPayment(expense.category_id, expense.credit_card_account_id);
    const isLoanPaymentFlag = await isLoanPayment(expense.category_id, expense.loan_account_id);

    // Soft delete
    await db('expenses')
      .where('id', id)
      .update({
        deleted_at: db.fn.now(),
      });

    // Unlink all tags
    await unlinkTagsFromExpense(id);

    // Revert account balance based on account type
    if (isBillPayment) {
      // Reverse the bill payment: increase source balance, increase target credit card balance and decrease available_credit
      await db('accounts')
        .where('id', expense.account_id)
        .increment('balance', expense.amount);

      const creditCardAccount = await getTargetCreditCardAccount(userId, expense.credit_card_account_id);
      if (creditCardAccount) {
        await db('accounts')
          .where('id', creditCardAccount.id)
          .decrement('available_credit', expense.amount);
      }
    } else if (isLoanPaymentFlag) {
      // Reverse the loan payment: increase source balance and increase target loan balance
      await db('accounts')
        .where('id', expense.account_id)
        .increment('balance', expense.amount);

      await revertLoanPaymentByExpenseId(expense.loan_account_id, id);
    } else if (account.type === 'credit_card') {
      // For credit cards, only update available_credit (no balance update)
      await db('account_details')
        .where('account_id', expense.account_id)
        .increment('available_credit', expense.amount);
    } else if (account.type === 'loan') {
      // For loans, only update loan_balance (no balance update)
      await db('account_details')
        .where('account_id', expense.account_id)
        .decrement('loan_balance', expense.amount);
    } else {
      await db('accounts')
        .where('id', expense.account_id)
        .increment('balance', expense.amount);
    }

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

    // Exclude credit card bill payments from total expenses
    // Credit card bill payments are identified by having a credit_card_account_id
    // (they represent repayment of credit card spending, not new expenses)
    let query = db('expenses')
      .select(
        db.raw('COUNT(*) as total_count'),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total_amount')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      });

    if (start_date) {
      query = query.where('expenses.expense_date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('expenses.expense_date', '<=', end_date);
    }

    const summary = await query.first();

    // Get category breakdown (excluding credit card bill payments)
    const byCategory = await db('expenses')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
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
