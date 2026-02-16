import { Request, Response, NextFunction } from 'express';
import { db } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

const handleError = (next: NextFunction, error: unknown): void => {
    if (error instanceof AppError) {
        next(error);
    } else {
        console.error('Metrics controller error:', error);
        next(new AppError('Internal server error', 500));
    }
};

// ============================================================
// HELPER: Spending Habits
// ============================================================
async function computeSpendingHabits(userId: string, months: number) {
    const startDate = db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months')`);

    // Total expenses in period
    const totalResult = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(db.raw('COALESCE(SUM(expenses.amount), 0) as total'))
        .first();

    const totalExpenses = Number(totalResult?.total || 0);

    // Days in period
    const daysResult = await db.raw(`SELECT EXTRACT(DAY FROM CURRENT_DATE - date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months'))::int + 1 as days`);
    const daysInPeriod = Number(daysResult.rows[0]?.days || months * 30);

    const avgDailySpend = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0;
    const avgMonthlySpend = months > 0 ? totalExpenses / months : 0;

    // Spending by day of week
    const byDayOfWeek = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            db.raw("EXTRACT(DOW FROM expenses.expense_date)::int as day_of_week"),
            db.raw('COALESCE(SUM(expenses.amount), 0) as total')
        )
        .groupBy(db.raw("EXTRACT(DOW FROM expenses.expense_date)::int"))
        .orderBy('day_of_week');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const spendingByDay = byDayOfWeek.map((d: any) => ({
        day: dayNames[d.day_of_week] || 'Unknown',
        day_of_week: d.day_of_week,
        total: Number(d.total),
    }));

    const highestDay = spendingByDay.length > 0
        ? spendingByDay.reduce((max: any, d: any) => d.total > max.total ? d : max, spendingByDay[0])
        : null;

    // Weekend vs weekday
    const weekendSpend = spendingByDay.filter((d: any) => d.day_of_week === 0 || d.day_of_week === 6).reduce((s: number, d: any) => s + d.total, 0);
    const weekdaySpend = spendingByDay.filter((d: any) => d.day_of_week >= 1 && d.day_of_week <= 5).reduce((s: number, d: any) => s + d.total, 0);

    // Top spending categories
    const topCategories = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            'categories.name as category',
            db.raw('COALESCE(SUM(expenses.amount), 0) as total')
        )
        .groupBy('categories.name')
        .orderBy('total', 'desc')
        .limit(5);

    // Monthly totals for MoM comparison
    const monthlyTotals = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM') as month"),
            db.raw('COALESCE(SUM(expenses.amount), 0) as total')
        )
        .groupBy(db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM')"))
        .orderBy('month');

    const monthlyData = monthlyTotals.map((m: any) => ({ month: m.month, total: Number(m.total) }));

    let momChange = null;
    if (monthlyData.length >= 2) {
        const current = monthlyData[monthlyData.length - 1].total;
        const previous = monthlyData[monthlyData.length - 2].total;
        momChange = previous > 0 ? ((current - previous) / previous) * 100 : null;
    }

    return {
        total_expenses: totalExpenses,
        avg_daily_spend: Math.round(avgDailySpend * 100) / 100,
        avg_monthly_spend: Math.round(avgMonthlySpend * 100) / 100,
        highest_spending_day: highestDay,
        spending_by_day: spendingByDay,
        weekend_spend: weekendSpend,
        weekday_spend: weekdaySpend,
        weekend_vs_weekday_ratio: weekdaySpend > 0 ? Math.round((weekendSpend / weekdaySpend) * 100) / 100 : 0,
        top_categories: topCategories.map((c: any) => ({ category: c.category, total: Number(c.total) })),
        monthly_totals: monthlyData,
        mom_change: momChange !== null ? Math.round(momChange * 100) / 100 : null,
    };
}

// ============================================================
// HELPER: Savings Tracker
// ============================================================
async function computeSavingsTracker(userId: string, months: number) {
    const startDate = db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months')`);

    // Monthly incomes
    const monthlyIncomes = await db('incomes')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .where('income_date', '>=', startDate)
        .select(
            db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
            db.raw('COALESCE(SUM(amount), 0) as total')
        )
        .groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"));

    // Monthly expenses
    const monthlyExpenses = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM') as month"),
            db.raw('COALESCE(SUM(expenses.amount), 0) as total')
        )
        .groupBy(db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM')"));

    const incomeMap = new Map<string, number>(monthlyIncomes.map((i: any) => [i.month, Number(i.total)]));
    const expenseMap = new Map<string, number>(monthlyExpenses.map((e: any) => [e.month, Number(e.total)]));
    const allMonths = [...new Set([...incomeMap.keys(), ...expenseMap.keys()])].sort();

    const monthlyData = allMonths.map(month => {
        const income: number = incomeMap.get(month) || 0;
        const expense: number = expenseMap.get(month) || 0;
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        return { month, income, expense, savings, savings_rate: Math.round(savingsRate * 100) / 100 };
    });

    const totalIncome = monthlyData.reduce((s: number, m) => s + m.income, 0);
    const totalExpenses = monthlyData.reduce((s: number, m) => s + m.expense, 0);
    const totalSavings = totalIncome - totalExpenses;
    const currentSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    // Rolling average savings rate
    const rates = monthlyData.map(m => m.savings_rate);
    const avgSavingsRate = rates.length > 0
        ? rates.reduce((s, r) => s + r, 0) / rates.length
        : 0;

    // Trend: compare last 3 months average to prior 3
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (rates.length >= 4) {
        const recent = rates.slice(-3).reduce((s, r) => s + r, 0) / 3;
        const prior = rates.slice(-6, -3).reduce((s, r) => s + r, 0) / Math.min(3, rates.slice(-6, -3).length || 1);
        if (recent > prior + 2) trend = 'improving';
        else if (recent < prior - 2) trend = 'declining';
    }

    const avgMonthlySavings = monthlyData.length > 0 ? totalSavings / monthlyData.length : 0;

    return {
        current_savings_rate: Math.round(currentSavingsRate * 100) / 100,
        avg_savings_rate: Math.round(avgSavingsRate * 100) / 100,
        trend,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        total_savings: totalSavings,
        avg_monthly_savings: Math.round(avgMonthlySavings * 100) / 100,
        projected_annual_savings: Math.round(avgMonthlySavings * 12 * 100) / 100,
        monthly_data: monthlyData,
    };
}

// ============================================================
// HELPER: Retirement Planning
// ============================================================
async function computeRetirementPlanning(userId: string) {
    // Get user age
    const user = await db('users')
        .where('id', userId)
        .select('age', 'date_of_birth')
        .first();

    // Get financial preferences
    const prefs = await db('financial_preferences')
        .where('user_id', userId)
        .first();

    const currentAge = user?.age || (user?.date_of_birth ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null);
    const retirementAge = prefs?.expected_retirement_age || 60;
    const lifeExpectancy = prefs?.life_expectancy || 80;
    const annualReturn = Number(prefs?.expected_annual_return || 8) / 100;
    const inflationRate = Number(prefs?.expected_inflation_rate || 6) / 100;
    const realReturn = ((1 + annualReturn) / (1 + inflationRate)) - 1;

    if (!currentAge || currentAge >= retirementAge) {
        return {
            configured: !!prefs,
            current_age: currentAge,
            retirement_age: retirementAge,
            years_to_retirement: 0,
            current_corpus: 0,
            required_corpus: 0,
            monthly_investment_needed: 0,
            retirement_readiness: 0,
            projected_corpus: 0,
            message: currentAge ? 'You are at or past retirement age.' : 'Please set your age in your profile.',
        };
    }

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    // Current corpus = total invested amount (not returns since they aren't tracked)
    const investmentsResult = await db('investments')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .where('status', 'active')
        .select(db.raw('COALESCE(SUM(amount - COALESCE(withdrawal_amount, 0)), 0) as total'))
        .first();

    const currentCorpus = Number(investmentsResult?.total || 0);

    // Monthly expense for retirement (from preferences or average last 6 months expenses)
    let monthlyRetirementExpense = Number(prefs?.monthly_retirement_expense || 0);
    if (!monthlyRetirementExpense) {
        const avgExpResult = await db('expenses')
            .where('expenses.user_id', userId)
            .whereNull('expenses.deleted_at')
            .where('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '6 months'`))
            .leftJoin('categories', 'expenses.category_id', 'categories.id')
            .whereNot(function () {
                this.where('categories.name', 'Credit Card')
                    .whereNotNull('expenses.credit_card_account_id');
            })
            .select(db.raw('COALESCE(SUM(expenses.amount), 0) / 6 as avg_monthly'))
            .first();
        monthlyRetirementExpense = Number(avgExpResult?.avg_monthly || 0);
    }

    // Required corpus = present value of annuity (inflation-adjusted expenses over retirement years)
    // Using real return rate
    let requiredCorpus = 0;
    if (monthlyRetirementExpense > 0 && yearsInRetirement > 0) {
        const monthlyRealReturn = realReturn / 12;
        const n = yearsInRetirement * 12;

        // Future monthly expense at retirement (adjusted for inflation)
        const futureMonthlyExpense = monthlyRetirementExpense * Math.pow(1 + inflationRate, yearsToRetirement);

        if (monthlyRealReturn > 0) {
            requiredCorpus = futureMonthlyExpense * (1 - Math.pow(1 + monthlyRealReturn, -n)) / monthlyRealReturn;
        } else {
            requiredCorpus = futureMonthlyExpense * n;
        }
    }

    // Projected corpus at retirement = current corpus grown at expected rate
    const projectedCorpus = currentCorpus * Math.pow(1 + annualReturn, yearsToRetirement);

    // Monthly SIP needed to fill the gap
    const gap = Math.max(0, requiredCorpus - projectedCorpus);
    let monthlyInvestmentNeeded = 0;
    if (gap > 0 && yearsToRetirement > 0) {
        const monthlyReturn = annualReturn / 12;
        const n = yearsToRetirement * 12;
        if (monthlyReturn > 0) {
            monthlyInvestmentNeeded = gap * monthlyReturn / (Math.pow(1 + monthlyReturn, n) - 1);
        } else {
            monthlyInvestmentNeeded = gap / n;
        }
    }

    const readiness = requiredCorpus > 0 ? Math.min(100, (projectedCorpus / requiredCorpus) * 100) : 0;

    return {
        configured: !!prefs,
        current_age: currentAge,
        retirement_age: retirementAge,
        life_expectancy: lifeExpectancy,
        years_to_retirement: yearsToRetirement,
        years_in_retirement: yearsInRetirement,
        expected_annual_return: annualReturn * 100,
        expected_inflation_rate: inflationRate * 100,
        monthly_retirement_expense: Math.round(monthlyRetirementExpense * 100) / 100,
        current_corpus: Math.round(currentCorpus * 100) / 100,
        required_corpus: Math.round(requiredCorpus * 100) / 100,
        projected_corpus: Math.round(projectedCorpus * 100) / 100,
        monthly_investment_needed: Math.round(monthlyInvestmentNeeded * 100) / 100,
        retirement_readiness: Math.round(readiness * 100) / 100,
        gap: Math.round(gap * 100) / 100,
    };
}

// ============================================================
// HELPER: Emergency Fund
// ============================================================
async function computeEmergencyFund(userId: string) {
    // Cash + savings + checking balances
    const accountsResult = await db('accounts')
        .where('user_id', userId)
        .where('is_active', true)
        .whereIn('type', ['checking', 'savings', 'cash'])
        .select(db.raw('COALESCE(SUM(balance), 0) as total'))
        .first();

    const accountBalance = Number(accountsResult?.total || 0);

    // Investments flagged as emergency fund
    const emergencyInvestments = await db('investments')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .where('status', 'active')
        .where('is_emergency_fund', true)
        .select(db.raw('COALESCE(SUM(amount - COALESCE(withdrawal_amount, 0)), 0) as total'))
        .first();

    const emergencyInvestmentValue = Number(emergencyInvestments?.total || 0);
    const totalEmergencyFund = accountBalance + emergencyInvestmentValue;

    // Average monthly expenses (6 months)
    const avgExpResult = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '6 months'`))
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(db.raw('COALESCE(SUM(expenses.amount), 0) / 6 as avg_monthly'))
        .first();

    const avgMonthlyExpenses = Number(avgExpResult?.avg_monthly || 0);
    const monthsOfCoverage = avgMonthlyExpenses > 0 ? totalEmergencyFund / avgMonthlyExpenses : 0;
    const target = avgMonthlyExpenses * 6;
    const gap = Math.max(0, target - totalEmergencyFund);

    return {
        current_fund: Math.round(totalEmergencyFund * 100) / 100,
        account_balance: Math.round(accountBalance * 100) / 100,
        emergency_investments: Math.round(emergencyInvestmentValue * 100) / 100,
        avg_monthly_expenses: Math.round(avgMonthlyExpenses * 100) / 100,
        months_of_coverage: Math.round(monthsOfCoverage * 100) / 100,
        target: Math.round(target * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        status: monthsOfCoverage >= 6 ? 'healthy' : monthsOfCoverage >= 3 ? 'building' : 'critical',
    };
}

// ============================================================
// HELPER: Debt-to-Income
// ============================================================
async function computeDebtToIncome(userId: string) {
    // Monthly debt payments: loan payments + credit card minimum payments
    const loanPayments = await db('accounts')
        .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
        .where('accounts.user_id', userId)
        .where('accounts.is_active', true)
        .where('accounts.type', 'loan')
        .select(db.raw('COALESCE(SUM(account_details.current_monthly_payment), 0) as total'))
        .first();

    const creditCardPayments = await db('accounts')
        .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
        .where('accounts.user_id', userId)
        .where('accounts.is_active', true)
        .where('accounts.type', 'credit_card')
        .select(
            db.raw('COALESCE(SUM(GREATEST((account_details.credit_limit - account_details.available_credit) * 0.02, 0)), 0) as min_payment')
        )
        .first();

    const totalMonthlyDebt = Number(loanPayments?.total || 0) + Number(creditCardPayments?.min_payment || 0);

    // Average monthly income (6 months)
    const avgIncResult = await db('incomes')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .where('income_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '6 months'`))
        .select(db.raw('COALESCE(SUM(amount), 0) / 6 as avg_monthly'))
        .first();

    const avgMonthlyIncome = Number(avgIncResult?.avg_monthly || 0);
    const dtiRatio = avgMonthlyIncome > 0 ? (totalMonthlyDebt / avgMonthlyIncome) * 100 : 0;

    let status: string;
    if (dtiRatio <= 20) status = 'healthy';
    else if (dtiRatio <= 36) status = 'manageable';
    else if (dtiRatio <= 50) status = 'high';
    else status = 'critical';

    return {
        total_monthly_debt: Math.round(totalMonthlyDebt * 100) / 100,
        loan_payments: Math.round(Number(loanPayments?.total || 0) * 100) / 100,
        credit_card_min_payments: Math.round(Number(creditCardPayments?.min_payment || 0) * 100) / 100,
        avg_monthly_income: Math.round(avgMonthlyIncome * 100) / 100,
        dti_ratio: Math.round(dtiRatio * 100) / 100,
        status,
    };
}

// ============================================================
// HELPER: Financial Health Score
// ============================================================
async function computeHealthScore(
    savings: Awaited<ReturnType<typeof computeSavingsTracker>>,
    emergencyFund: Awaited<ReturnType<typeof computeEmergencyFund>>,
    dti: Awaited<ReturnType<typeof computeDebtToIncome>>,
    userId: string
) {
    // Credit utilization
    const creditCards = await db('accounts')
        .leftJoin('account_details', 'accounts.id', 'account_details.account_id')
        .where('accounts.user_id', userId)
        .where('accounts.is_active', true)
        .where('accounts.type', 'credit_card')
        .select(
            db.raw('COALESCE(SUM(account_details.credit_limit), 0) as total_limit'),
            db.raw('COALESCE(SUM(account_details.credit_limit - account_details.available_credit), 0) as total_used')
        )
        .first();

    const creditUtilization = Number(creditCards?.total_limit || 0) > 0
        ? (Number(creditCards?.total_used || 0) / Number(creditCards?.total_limit || 0)) * 100
        : 0;

    // Investment rate (% of income invested)
    const investmentResult = await db('investments')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .where('status', 'active')
        .where('purchase_date', '>=', db.raw(`CURRENT_DATE - INTERVAL '6 months'`))
        .select(db.raw('COALESCE(SUM(amount), 0) / 6 as avg_monthly'))
        .first();

    const avgMonthlyInvestment = Number(investmentResult?.avg_monthly || 0);
    const investmentRate = savings.total_income > 0
        ? (avgMonthlyInvestment / (savings.total_income / (savings.monthly_data.length || 1))) * 100
        : 0;

    // Score each factor (0-100)
    const savingsScore = Math.min(100, (savings.current_savings_rate / 30) * 100);
    const dtiScore = dti.dti_ratio <= 20 ? 100 : Math.max(0, 100 - ((dti.dti_ratio - 20) / 30) * 100);
    const emergencyScore = Math.min(100, (emergencyFund.months_of_coverage / 6) * 100);
    const creditScore = creditUtilization <= 30 ? 100 : Math.max(0, 100 - ((creditUtilization - 30) / 70) * 100);
    const investmentScore = Math.min(100, (investmentRate / 20) * 100);

    // Weighted total
    const totalScore = (
        savingsScore * 0.25 +
        dtiScore * 0.20 +
        emergencyScore * 0.20 +
        creditScore * 0.15 +
        investmentScore * 0.20
    );

    let grade: string;
    if (totalScore >= 80) grade = 'Excellent';
    else if (totalScore >= 60) grade = 'Good';
    else if (totalScore >= 40) grade = 'Fair';
    else grade = 'Needs Improvement';

    return {
        total_score: Math.round(totalScore),
        grade,
        breakdown: {
            savings_rate: { score: Math.round(savingsScore), weight: 25, value: savings.current_savings_rate, target: 30 },
            debt_to_income: { score: Math.round(dtiScore), weight: 20, value: dti.dti_ratio, target: 20 },
            emergency_fund: { score: Math.round(emergencyScore), weight: 20, value: emergencyFund.months_of_coverage, target: 6 },
            credit_utilization: { score: Math.round(creditScore), weight: 15, value: Math.round(creditUtilization * 100) / 100, target: 30 },
            investment_rate: { score: Math.round(investmentScore), weight: 20, value: Math.round(investmentRate * 100) / 100, target: 20 },
        },
    };
}

// ============================================================
// HELPER: Expense Forecast
// ============================================================
async function computeExpenseForecast(userId: string, months: number) {
    const startDate = db.raw(`date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months')`);

    const monthlyTotals = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM') as month"),
            db.raw('COALESCE(SUM(expenses.amount), 0) as total')
        )
        .groupBy(db.raw("TO_CHAR(expenses.expense_date, 'YYYY-MM')"))
        .orderBy('month');

    const values = monthlyTotals.map((m: any) => Number(m.total));

    // Simple linear regression for projection
    let projectedNextMonth = 0;
    if (values.length >= 2) {
        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = values.reduce((s: number, v: number) => s + v, 0) / n;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (values[i] - yMean);
            denominator += (i - xMean) * (i - xMean);
        }
        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = yMean - slope * xMean;
        projectedNextMonth = Math.max(0, intercept + slope * n);
    } else if (values.length === 1) {
        projectedNextMonth = values[0];
    }

    // Category-wise projections (averages)
    const categoryTotals = await db('expenses')
        .where('expenses.user_id', userId)
        .whereNull('expenses.deleted_at')
        .where('expenses.expense_date', '>=', startDate)
        .leftJoin('categories', 'expenses.category_id', 'categories.id')
        .whereNot(function () {
            this.where('categories.name', 'Credit Card')
                .whereNotNull('expenses.credit_card_account_id');
        })
        .select(
            'categories.name as category',
            db.raw('COALESCE(SUM(expenses.amount), 0) as total'),
            db.raw('COUNT(DISTINCT TO_CHAR(expenses.expense_date, \'YYYY-MM\')) as active_months')
        )
        .groupBy('categories.name')
        .orderBy('total', 'desc')
        .limit(10);

    const categoryProjections = categoryTotals.map((c: any) => ({
        category: c.category,
        avg_monthly: Math.round((Number(c.total) / Math.max(1, Number(c.active_months))) * 100) / 100,
        total: Number(c.total),
    }));

    return {
        projected_next_month: Math.round(projectedNextMonth * 100) / 100,
        historical: monthlyTotals.map((m: any) => ({ month: m.month, total: Number(m.total) })),
        category_projections: categoryProjections,
    };
}

// ============================================================
// HELPER: Financial Advice Engine
// ============================================================
interface AdviceItem {
    type: 'warning' | 'tip' | 'positive';
    category: 'spending' | 'savings' | 'debt' | 'retirement' | 'investment' | 'emergency';
    message: string;
    priority: 'high' | 'medium' | 'low';
}

function generateAdvice(
    spending: Awaited<ReturnType<typeof computeSpendingHabits>>,
    savings: Awaited<ReturnType<typeof computeSavingsTracker>>,
    retirement: Awaited<ReturnType<typeof computeRetirementPlanning>>,
    healthScore: Awaited<ReturnType<typeof computeHealthScore>>,
    emergencyFund: Awaited<ReturnType<typeof computeEmergencyFund>>,
    dti: Awaited<ReturnType<typeof computeDebtToIncome>>,
): AdviceItem[] {
    const advice: AdviceItem[] = [];

    // Savings rate checks
    if (savings.current_savings_rate < 10) {
        advice.push({
            type: 'warning',
            category: 'savings',
            message: `Your savings rate is ${savings.current_savings_rate}%, well below the recommended 20%. Consider cutting back on ${spending.top_categories[0]?.category || 'discretionary'} spending.`,
            priority: 'high',
        });
    } else if (savings.current_savings_rate < 20) {
        advice.push({
            type: 'tip',
            category: 'savings',
            message: `Your savings rate is ${savings.current_savings_rate}%. Aim for 20%+ by reviewing your top spending categories.`,
            priority: 'medium',
        });
    } else if (savings.current_savings_rate >= 30) {
        advice.push({
            type: 'positive',
            category: 'savings',
            message: `Excellent savings rate of ${savings.current_savings_rate}%! You're saving well above the recommended threshold.`,
            priority: 'low',
        });
    }

    // Spending MoM increase
    if (spending.mom_change !== null && spending.mom_change > 15) {
        const topCat = spending.top_categories[0]?.category || 'expenses';
        advice.push({
            type: 'warning',
            category: 'spending',
            message: `Your spending increased by ${spending.mom_change}% this month. "${topCat}" is your highest spending category.`,
            priority: 'high',
        });
    }

    // Weekend spending
    if (spending.weekday_spend > 0 && spending.weekend_vs_weekday_ratio > 1.5) {
        const pct = Math.round((spending.weekend_vs_weekday_ratio - 1) * 100);
        advice.push({
            type: 'tip',
            category: 'spending',
            message: `You spend ${pct}% more on weekends relative to weekdays. Setting a weekend budget could help control spending.`,
            priority: 'medium',
        });
    }

    // Emergency fund
    if (emergencyFund.months_of_coverage < 3) {
        advice.push({
            type: 'warning',
            category: 'emergency',
            message: `You have only ${emergencyFund.months_of_coverage.toFixed(1)} months of emergency fund coverage. Aim for at least 6 months (₹${Math.round(emergencyFund.gap).toLocaleString()} gap).`,
            priority: 'high',
        });
    } else if (emergencyFund.months_of_coverage < 6) {
        advice.push({
            type: 'tip',
            category: 'emergency',
            message: `Your emergency fund covers ${emergencyFund.months_of_coverage.toFixed(1)} months. Keep building toward the 6-month target.`,
            priority: 'medium',
        });
    } else {
        advice.push({
            type: 'positive',
            category: 'emergency',
            message: `Your emergency fund covers ${emergencyFund.months_of_coverage.toFixed(1)} months of expenses. Well done!`,
            priority: 'low',
        });
    }

    // DTI ratio
    if (dti.dti_ratio > 36) {
        advice.push({
            type: 'warning',
            category: 'debt',
            message: `Your debt-to-income ratio is ${dti.dti_ratio}% — in the ${dti.status} zone. Consider prioritizing debt repayment.`,
            priority: 'high',
        });
    } else if (dti.dti_ratio > 20) {
        advice.push({
            type: 'tip',
            category: 'debt',
            message: `Your DTI ratio of ${dti.dti_ratio}% is manageable but above the ideal 20%. Focus on paying down high-interest debt.`,
            priority: 'medium',
        });
    }

    // Credit utilization
    if (healthScore.breakdown.credit_utilization.value > 50) {
        advice.push({
            type: 'warning',
            category: 'debt',
            message: `Credit card utilization is at ${healthScore.breakdown.credit_utilization.value}%. High utilization affects your credit health — try to keep it under 30%.`,
            priority: 'high',
        });
    }

    // Investment rate
    if (healthScore.breakdown.investment_rate.value < 5) {
        advice.push({
            type: 'tip',
            category: 'investment',
            message: `You're investing very little of your income. Even small SIPs can grow significantly over time through compounding.`,
            priority: 'medium',
        });
    } else if (healthScore.breakdown.investment_rate.value >= 20) {
        advice.push({
            type: 'positive',
            category: 'investment',
            message: `Great investment discipline! You're investing ${healthScore.breakdown.investment_rate.value}% of your income.`,
            priority: 'low',
        });
    }

    // Retirement readiness
    if (retirement.configured && retirement.retirement_readiness < 25 && retirement.years_to_retirement > 0) {
        advice.push({
            type: 'warning',
            category: 'retirement',
            message: `Your retirement corpus is only at ${retirement.retirement_readiness}% of target. Increasing your monthly investment by ₹${Math.round(retirement.monthly_investment_needed).toLocaleString()} could close the gap.`,
            priority: 'high',
        });
    }

    // Savings trend
    if (savings.trend === 'improving') {
        advice.push({
            type: 'positive',
            category: 'savings',
            message: `Your savings rate has been improving. Keep up the momentum!`,
            priority: 'low',
        });
    } else if (savings.trend === 'declining') {
        advice.push({
            type: 'warning',
            category: 'savings',
            message: `Your savings rate has been declining recently. Review your recent spending to identify areas to cut back.`,
            priority: 'medium',
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    advice.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return advice;
}

// ============================================================
// MAIN: Get Financial Metrics
// ============================================================
export const getFinancialMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq = req as any;
        const userId = authReq.user?.id;
        const months = Number(req.query.months) || 6;

        // Compute all metrics (some in parallel)
        const [spendingHabits, savingsTracker, retirementPlanning, emergencyFund, debtToIncome, expenseForecast] = await Promise.all([
            computeSpendingHabits(userId, months),
            computeSavingsTracker(userId, months),
            computeRetirementPlanning(userId),
            computeEmergencyFund(userId),
            computeDebtToIncome(userId),
            computeExpenseForecast(userId, months),
        ]);

        // Health score depends on savings, emergency fund, DTI
        const financialHealthScore = await computeHealthScore(savingsTracker, emergencyFund, debtToIncome, userId);

        // Generate advice based on all metrics
        const advice = generateAdvice(spendingHabits, savingsTracker, retirementPlanning, financialHealthScore, emergencyFund, debtToIncome);

        res.json({
            spending_habits: spendingHabits,
            savings_tracker: savingsTracker,
            retirement_planning: retirementPlanning,
            financial_health_score: financialHealthScore,
            emergency_fund: emergencyFund,
            debt_to_income: debtToIncome,
            expense_forecast: expenseForecast,
            advice,
        });
    } catch (error) {
        handleError(next, error);
    }
};
