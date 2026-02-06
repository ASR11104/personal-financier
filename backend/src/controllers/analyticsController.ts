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

// Get monthly expense trends
export const getMonthlyExpenseTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get expenses grouped by month (excluding credit card bill payments)
    const monthlyExpenses = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${limitMonths - 1} months')`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .orderBy('month', 'asc')
      .limit(limitMonths);

    // Get category breakdown for the period (excluding credit card bill payments)
    const byCategory = await db('expenses')
      .select(
        'categories.name as category',
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${limitMonths - 1} months')`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
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
      .andWhere('income_date', '>=', db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${limitMonths - 1} months')`))
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
      .andWhere('incomes.income_date', '>=', db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${limitMonths - 1} months')`))
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
    const { months = 12, start_date, end_date } = req.query;

    const limitMonths = Number(months);

    // Build income query with optional date filters
    let incomeQuery = db('incomes')
      .select(
        db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total')
      )
      .where('user_id', userId)
      .whereNull('deleted_at');

    // Build expense query with optional date filters
    let expenseQuery = db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      });

    if (start_date) {
      incomeQuery = incomeQuery.andWhere('income_date', '>=', start_date);
      expenseQuery = expenseQuery.andWhere('expense_date', '>=', start_date);
    } else {
      // Use months-based filtering when no start_date provided
      const startOfMonth = db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${limitMonths - 1} months')`);
      incomeQuery = incomeQuery.andWhere('income_date', '>=', startOfMonth);
      expenseQuery = expenseQuery.andWhere('expense_date', '>=', startOfMonth);
    }

    if (end_date) {
      incomeQuery = incomeQuery.andWhere('income_date', '<=', end_date);
      expenseQuery = expenseQuery.andWhere('expense_date', '<=', end_date);
    }

    incomeQuery = incomeQuery.groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"));
    expenseQuery = expenseQuery.groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"));

    const monthlyIncomes = await incomeQuery;
    const monthlyExpenses = await expenseQuery;

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

    // Get all investments for the user
    const investments = await db('investments')
      .select(
        db.raw('COALESCE(SUM(investments.amount - COALESCE(investments.withdrawal_amount, 0)), 0) as total_value')
      )
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at')
      .first();

    const totalInvestmentValue = Number(investments?.total_value || 0);

    // Calculate totals
    // Assets: checking + savings + cash + investment holdings value
    const checkingSavingsCash = accounts
      .filter(a => ['checking', 'savings', 'cash'].includes(a.type))
      .reduce((sum, a) => sum + Number(a.balance || 0), 0);

    // Total Assets = checking/savings/cash balance + investment holdings value
    const totalAssets = checkingSavingsCash + totalInvestmentValue;

    // Liabilities: credit card balance (credit_limit - available_credit) + loan balance
    const creditCardBalance = accounts
      .filter(a => a.type === 'credit_card')
      .reduce((sum, a) => sum + Number((a.credit_limit || 0) - (a.available_credit || 0)), 0);

    const loanBalance = accounts
      .filter(a => a.type === 'loan')
      .reduce((sum, a) => sum + Number(a.loan_balance || a.balance || 0), 0);

    const totalLiabilities = creditCardBalance + loanBalance;

    const netWorth = totalAssets - totalLiabilities;

    // Credit card utilization
    const creditCards = accounts.filter(a => a.type === 'credit_card');
    const totalCreditLimit = creditCards.reduce((sum, a) => sum + Number(a.credit_limit || 0), 0);
    const totalCreditUsed = creditCards.reduce((sum, a) => sum + Number((a.credit_limit || 0) - (a.available_credit || 0)), 0);
    const totalAvailableCredit = creditCards.reduce((sum, a) => sum + Number(a.available_credit || 0), 0);
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    // Loan summary
    const loans = accounts.filter(a => a.type === 'loan');
    const totalLoanBalance = loans.reduce((sum, a) => sum + Number(a.loan_balance || a.balance || 0), 0);
    const totalLoanAmount = loans.reduce((sum, a) => sum + Number(a.loan_amount || a.balance || 0), 0);

    // Account breakdown by type
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
        acc[type].total_balance += Number(account.balance || 0);
      }
      return acc;
    }, {});

    // Get individual asset accounts (excluding credit cards and loans)
    const assetAccounts = accounts
      .filter(a => !['credit_card', 'loan'].includes(a.type))
      .map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance || 0),
      }));

    res.json({
      netWorth,
      totalAssets,
      totalLiabilities,
      breakdown: {
        assets: {
          checking_savings_cash: checkingSavingsCash,
          investment_holdings: totalInvestmentValue,
        },
        liabilities: {
          credit_cards: creditCardBalance,
          loans: loanBalance,
        },
      },
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
      accounts: assetAccounts,
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

    // Get spending by day (excluding credit card bill payments)
    const spendingByDay = await db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'DY') as day_name"),
        db.raw('EXTRACT(DOW FROM expense_date) as day_of_week'),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
      .groupBy(db.raw("TO_CHAR(expense_date, 'DY')"))
      .groupBy(db.raw('EXTRACT(DOW FROM expense_date)'))
      .orderBy('day_of_week', 'asc');

    // Get category breakdown by day (excluding credit card bill payments)
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
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
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

    // Get total spending by tags (excluding credit card bill payments)
    const spendingByTagsQuery = db('expenses')
      .select(
        'tags.id as tag_id',
        db.raw("COALESCE(tags.name, 'Untagged') as tag_name"),
        db.raw("COALESCE(tags.color, '#9CA3AF') as tag_color"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total'),
        db.raw('COUNT(DISTINCT expenses.id) as count')
      )
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('total', 'desc');
    
    console.log('Spending by tags query:', spendingByTagsQuery.toSQL());
    const spendingByTags = await spendingByTagsQuery;

    // Get monthly trends by tags (excluding credit card bill payments)
    const monthlyByTagsQuery = db('expenses')
      .select(
        db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
        'tags.id as tag_id',
        db.raw("COALESCE(tags.name, 'Untagged') as tag_name"),
        db.raw("COALESCE(tags.color, '#9CA3AF') as tag_color"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('month', 'asc')
      .orderBy('total', 'desc');
    
    console.log('Monthly by tags query:', monthlyByTagsQuery.toSQL());
    const monthlyByTags = await monthlyByTagsQuery;

    // Get category breakdown by tags (excluding credit card bill payments)
    const categoryByTagsQuery = db('expenses')
      .select(
        'categories.name as category',
        'tags.id as tag_id',
        db.raw("COALESCE(tags.name, 'Untagged') as tag_name"),
        db.raw("COALESCE(tags.color, '#9CA3AF') as tag_color"),
        db.raw('COALESCE(SUM(expenses.amount), 0) as total')
      )
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('expense_tags', 'expenses.id', 'expense_tags.expense_id')
      .leftJoin('tags', 'expense_tags.tag_id', 'tags.id')
      .where('expenses.user_id', userId)
      .whereNull('expenses.deleted_at')
      .andWhere('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .whereNot(function() {
        this.where('categories.name', 'Credit Card')
          .whereNotNull('expenses.credit_card_account_id');
      })
      .groupBy('categories.name')
      .groupBy('tags.id')
      .groupBy('tags.name')
      .groupBy('tags.color')
      .orderBy('category', 'asc')
      .orderBy('total', 'desc');
    
    console.log('Category by tags query:', categoryByTagsQuery.toSQL());
    const categoryByTags = await categoryByTagsQuery;

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

// Get investment overview
export const getInvestmentOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;

    // Get all investments
    const investments = await db('investments')
      .select(
        'investments.*',
        'investment_types.name as investment_type_name',
        'accounts.name as account_name'
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .leftJoin('accounts', 'investments.account_id', 'accounts.id')
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at');

    // Calculate totals
    const totalInvestments = investments.length;
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const currentValue = investments.reduce((sum, inv) => {
      const withdrawalAmount = Number(inv.withdrawal_amount || 0);
      const currentAmount = Number(inv.amount || 0) - withdrawalAmount;
      return sum + currentAmount;
    }, 0);
    
    // Calculate returns
    const totalReturns = currentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Breakdown by status
    const byStatus = investments.reduce((acc: Record<string, { count: number; total_amount: number }>, inv: any) => {
      const status = inv.status || 'active';
      if (!acc[status]) {
        acc[status] = { count: 0, total_amount: 0 };
      }
      acc[status].count++;
      const withdrawalAmount = Number(inv.withdrawal_amount || 0);
      const currentAmount = Number(inv.amount || 0) - withdrawalAmount;
      acc[status].total_amount += currentAmount;
      return acc;
    }, {});

    // Breakdown by type
    const byType = investments.reduce((acc: Record<string, { count: number; total_amount: number; invested: number }>, inv: any) => {
      const type = inv.investment_type_name || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, total_amount: 0, invested: 0 };
      }
      acc[type].count++;
      const withdrawalAmount = Number(inv.withdrawal_amount || 0);
      const currentAmount = Number(inv.amount || 0) - withdrawalAmount;
      acc[type].total_amount += currentAmount;
      acc[type].invested += Number(inv.amount || 0);
      return acc;
    }, {});

    // SIP summary
    const sipInvestments = investments.filter((inv: any) => inv.is_sip);
    const sipSummary = {
      total_sips: sipInvestments.length,
      total_sip_amount: sipInvestments.reduce((sum: number, inv: any) => sum + Number(inv.sip_amount || 0), 0),
      total_installments: sipInvestments.reduce((sum: number, inv: any) => sum + Number(inv.sip_installments_completed || 0), 0),
    };

    res.json({
      summary: {
        total_investments: totalInvestments,
        total_invested: totalInvested,
        current_value: currentValue,
        total_returns: totalReturns,
        returns_percentage: returnsPercentage,
      },
      by_status: Object.entries(byStatus).map(([status, data]) => ({
        status,
        count: data.count,
        total_amount: data.total_amount,
      })),
      by_type: Object.entries(byType).map(([type, data]) => ({
        investment_type: type,
        count: data.count,
        current_value: data.total_amount,
        invested: data.invested,
      })),
      sip_summary: sipSummary,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get investment trends (monthly)
export const getInvestmentTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;
    const { months = 12 } = req.query;

    const limitMonths = Number(months);

    // Get monthly investment amounts
    const monthlyInvestments = await db('investments')
      .select(
        db.raw("TO_CHAR(purchase_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .where('user_id', userId)
      .whereNull('deleted_at')
      .andWhere('purchase_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(purchase_date, 'YYYY-MM')"))
      .orderBy('month', 'asc');

    // Get investments by type per month
    const byTypeMonthly = await db('investments')
      .select(
        db.raw("TO_CHAR(purchase_date, 'YYYY-MM') as month"),
        'investment_types.name as investment_type',
        db.raw('COALESCE(SUM(investments.amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at')
      .andWhere('investments.purchase_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(purchase_date, 'YYYY-MM')"))
      .groupBy('investment_types.name')
      .orderBy('month', 'asc');

    // Get SIP transactions per month
    const sipTransactions = await db('sip_transactions')
      .select(
        db.raw("TO_CHAR(transaction_date, 'YYYY-MM') as month"),
        db.raw('COALESCE(SUM(amount), 0) as total'),
        db.raw('COUNT(*) as count')
      )
      .whereIn('investment_id', 
        db('investments').select('id').where('user_id', userId).whereNull('deleted_at')
      )
      .andWhere('transaction_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '${limitMonths} months'`))
      .groupBy(db.raw("TO_CHAR(transaction_date, 'YYYY-MM')"))
      .orderBy('month', 'asc');

    res.json({
      monthly_investments: monthlyInvestments,
      by_type_monthly: byTypeMonthly,
      sip_transactions: sipTransactions,
    });
  } catch (error) {
    handleError(next, error);
  }
};

// Get investment performance by type
export const getInvestmentPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as any;
    const userId = authReq.user?.id;

    // Get all investments with details
    const investments = await db('investments')
      .select(
        'investments.*',
        'investment_types.name as investment_type_name'
      )
      .leftJoin('investment_types', 'investments.investment_type_id', 'investment_types.id')
      .where('investments.user_id', userId)
      .whereNull('investments.deleted_at')
      .orderBy('investment_type_name', 'asc')
      .orderBy('purchase_date', 'desc');

    // Calculate performance metrics by type
    const performanceByType = investments.reduce((acc: Record<string, {
      type: string;
      count: number;
      total_invested: number;
      current_value: number;
      investments: any[];
    }>, inv: any) => {
      const type = inv.investment_type_name || 'Unknown';
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          total_invested: 0,
          current_value: 0,
          investments: [],
        };
      }
      const withdrawalAmount = Number(inv.withdrawal_amount || 0);
      const currentAmount = Number(inv.amount || 0) - withdrawalAmount;
      acc[type].count++;
      acc[type].total_invested += Number(inv.amount || 0);
      acc[type].current_value += currentAmount;
      acc[type].investments.push({
        id: inv.id,
        name: inv.name,
        invested: Number(inv.amount || 0),
        current_value: currentAmount,
        returns: currentAmount - Number(inv.amount || 0),
        returns_percentage: Number(inv.amount) > 0 
          ? ((currentAmount - Number(inv.amount)) / Number(inv.amount)) * 100 
          : 0,
        purchase_date: inv.purchase_date,
        status: inv.status,
      });
      return acc;
    }, {});

    const performance = Object.values(performanceByType).map((item) => ({
      type: item.type,
      count: item.count,
      total_invested: item.total_invested,
      current_value: item.current_value,
      total_returns: item.current_value - item.total_invested,
      returns_percentage: item.total_invested > 0 
        ? ((item.current_value - item.total_invested) / item.total_invested) * 100 
        : 0,
      top_performers: item.investments
        .sort((a: any, b: any) => b.returns_percentage - a.returns_percentage)
        .slice(0, 5),
    }));

    res.json({ performance });
  } catch (error) {
    handleError(next, error);
  }
};
