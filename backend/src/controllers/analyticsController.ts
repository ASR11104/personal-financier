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

// Get monthly expense trends
export const getMonthlyExpenseTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get expenses grouped by month
    const monthlyExpenses = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .orderBy('month', 'asc')
      .limit(limitMonths);

    // Get category breakdown for the period
    const byCategory = await db('expenses')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('categories.name')
      .orderBy('total', 'desc');

    res.json({
      monthly_expenses: monthlyExpenses,
      by_category: byCategory,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get monthly income trends
export const getMonthlyIncomeTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get incomes grouped by month
    const monthlyIncomes = await db('incomes')
      .select(
        db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"))
      .orderBy('month', 'asc')
      .limit(limitMonths);

    // Get category breakdown for the period
    const byCategory = await db('incomes')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(incomes.amount), 0) as total')
      )
      .leftJoin('categories', 'incomes.category_id', 'categories.id')
      .where('incomes.user_id', userId)
      .whereNull('incomes.deleted_at')
      .andWhere('incomes.income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('categories.name')
      .orderBy('total', 'desc');

    res.json({
      monthly_incomes: monthlyIncomes,
      by_category: byCategory,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get income vs expense comparison
export const getIncomeVsExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get monthly income
    const monthlyIncomes = await db('incomes')
      .select(
        db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"));

    // Get monthly expenses
    const monthlyExpenses = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"));

    // Merge the results
    const incomeMap = new Map<string, number>(monthlyIncomes.map((i: any) => [i.month, Number(i.total)]));
    const expenseMap = new Map<string, number>(monthlyExpenses.map((e: any) => [e.month, Number(e.total)]));

    const monthsList = [...new Set([...monthlyIncomes.map((i: any) => i.month), ...monthlyExpenses.map((e: any) => e.month)])].sort();

    const comparison = monthsList.map(month => {
      const income = incomeMap.get(month) || 0;
      const expense = expenseMap.get(month) || 0;
      return {
        month,
        income,
        expense,
        net: income - expense,
        savings_rate: income > 0 ? ((income - expense) / income) * 100 : 0,
      };
    });

    // Get totals
    const totalIncome = monthlyIncomes.reduce((sum: number, i: any) => sum + Number(i.total), 0);
    const totalExpense = monthlyExpenses.reduce((sum: number, e: any) => sum + Number(e.total), 0);

    res.json({
      comparison,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_savings: totalIncome - totalExpense,
        overall_savings_rate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
      },
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get account analytics (net worth, debt, etc.)
export const getAccountAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;

    // Get all active accounts with details
    const accounts = await db('accounts')
      .select(
        'accounts.*',
        'account_details.credit_limit',
        'account_details.available_credit',
        'account_details.loan_balance',
        'account_details.loan_amount',
        'account_details.interest_rate'
      )
      .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
      .where('accounts.user_id', userId)
      .where('accounts.is_active', true);

    // Calculate totals
    // For credit cards, use credit_limit - available_credit (from account_details) instead of balance
    // For loans, use loan_balance (from account_details) instead of balance
    const totalAssets = accounts
      .filter(a => !['credit_card', 'loan'].includes(a.type))
      .reduce((sum, a) => sum + Number(a.balance), 0);

    const totalLiabilities = accounts
      .filter(a => a.type === 'credit_card')
      .reduce((sum, a) => sum + Number((a.credit_limit || 0) - (a.available_credit || 0)), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Credit card utilization - use account_details
    const creditCards = accounts.filter(a => a.type === 'credit_card');
    const totalCreditLimit = creditCards.reduce((sum, a) => sum + Number(a.credit_limit || 0), 0);
    const totalCreditUsed = creditCards.reduce((sum, a) => sum + Number((a.credit_limit || 0) - (a.available_credit || 0)), 0);
    const totalAvailableCredit = creditCards.reduce((sum, a) => sum + Number(a.available_credit || 0), 0);
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    // Loan summary
    const loans = accounts.filter(a => a.type === 'loan');
    const totalLoanBalance = loans.reduce((sum, a) => sum + Number(a.loan_balance || a.balance), 0);
    const totalLoanAmount = loans.reduce((sum, a) => sum + Number(a.loan_amount || a.balance), 0);

    // Account breakdown by type - use account_details for credit_card and loan
    const byType = accounts.reduce((acc: Record<string, { count: number; total_balance: number }>, account: any) => {
      const type = account.type;
      if (!acc[type]) {
        acc[type] = { count: 0, total_balance: 0 };
      }
      acc[type].count++;
      // Use account_details for credit_card and loan
      if (type === 'credit_card') {
        acc[type].total_balance += Number((account.credit_limit || 0) - (account.available_credit || 0));
      } else if (type === 'loan') {
        acc[type].total_balance += Number(account.loan_balance || 0);
      } else {
        acc[type].total_balance += Number(account.balance);
      }
      return acc;
    }, {});

    res.json({
      netWorth,
      totalAssets,
      totalLiabilities,
      creditCards: {
        total_limit: totalCreditLimit,
        total_used: totalCreditUsed,
        total_available: totalAvailableCredit,
        utilization_percentage: creditUtilization,
        cards: creditCards.map(cc => ({
          id: cc.id,
          name: cc.name,
          // Credit card balance is calculated from account_details
          balance: Number((cc.credit_limit || 0) - (cc.available_credit || 0)),
          credit_limit: cc.credit_limit,
          available_credit: cc.available_credit,
          utilization: cc.credit_limit ? (Number((cc.credit_limit || 0) - (cc.available_credit || 0)) / Number(cc.credit_limit)) * 100 : 0,
        })),
      },
      loans: {
        total_balance: totalLoanBalance,
        total_original_amount: totalLoanAmount,
        count: loans.length,
        accounts: loans.map(l => ({
          id: l.id,
          name: l.name,
          balance: l.loan_balance, // Use loan_balance from account_details
          loan_balance: l.loan_balance,
          loan_amount: l.loan_amount,
          interest_rate: l.interest_rate,
        })),
      },
      by_type: Object.entries(byType).map(([type, data]) => ({
        type,
        count: data.count,
        total_balance: data.total_balance,
      })),
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get spending by day of week
export const getSpendingByDayOfWeek = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 6 } = req.query;

    const limitMonths = Number(months);

    const spendingByDay = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'DY') as day_name"),
        db.raw('EXTRACT(DOW FROM expense_date) as day_of_week'),
        db.raw('COALESCE(SUM(amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(expense_date, 'DY')"))
      .groupBy(db.raw('EXTRACT(DOW FROM expense_date)'))
      .orderBy('day_of_week', 'asc');

    // Get category breakdown by day
    const categoryByDay = await db('expenses')
      .select(
        'categories.name as category',
        db.raw("TO_CHAR(expense_date, 'DY') as day_name"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('categories.name')
      .groupBy(db.raw("TO_CHAR(expense_date, 'DY')"))
      .orderBy('category', 'asc')
      .orderBy('day_name', 'asc');

    res.json({
      by_day: spendingByDay,
      category_by_day: categoryByDay,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get spending by tags
export const getSpendingByTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get total spending by tags
    const spendingByTags = await db('expenses')
      .select(
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total'),
        db.raw('COUNT(DISTINCT expenses.id) as count')
      )
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('total', 'desc');

    // Get monthly trends by tags
    const monthlyByTags = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('month', 'asc')
      .orderBy('total', 'desc');

    // Get category breakdown by tags
    const categoryByTags = await db('expenses')
      .select(
        'categories.name as category',
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('categories.name')
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('category', 'asc')
      .orderBy('total', 'desc');

    res.json({
      by_tags: spendingByTags,
      monthly_by_tags: monthlyByTags,
      category_by_tags: categoryByTags,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get income by tags
export const getIncomeByTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get total income by tags
    const incomeByTags = await db('incomes')
      .select(
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        db.raw('COALESCE(SUM(incomes.amount), 0) as total'),
        db.raw('COUNT(DISTINCT incomes.id) as count')
      )
      .leftJoin('income_tags', 'incomes.id', 'income_tags.income_id')
      .leftJoin('tags', 'income_tags.tag_id', 'tags.id')
      .where('incomes.user_id', userId)
      .whereNull('incomes.deleted_at')
      .andWhere('incomes.income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('total', 'desc');

    // Get monthly trends by tags
    const monthlyByTags = await db('incomes')
      .select(
        db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
        'tags.id as tag_id',
        'tags.name as tag_name',
        'tags.color as tag_color',
        db.raw('COALESCE(SUM(incomes.amount), 0) as total')
      )
      .leftJoin('income_tags', 'incomes.id', 'income_tags.income_id')
      .leftJoin('tags', 'income_tags.tag_id', 'tags.id')
      .where('incomes.user_id', userId)
      .whereNull('incomes.deleted_at')
      .andWhere('incomes.income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"))
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('month', 'asc')
      .orderBy('total', 'desc');

    res.json({
      by_tags: incomeByTags,
      monthly_by_tags: monthlyByTags,
    });
  } catch (error) {
    handleError(next, error);
  }
};
