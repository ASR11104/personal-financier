import { useState, useMemo } from 'react';
import { useExpenseSummary, useIncomeSummary, useExpenseTrends, useIncomeVsExpense, useAccountAnalytics, useProfile, useSpendingByTags, useIncomeByTags, useInvestmentOverview, useInvestmentTrends, useInvestmentPerformance } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { formatCurrency } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Analytics() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const months = period === 'week' ? 1 : period === 'month' ? 6 : 12;

  const { data: expenseSummary, isLoading: expenseLoading } = useExpenseSummary();
  const { data: incomeSummary, isLoading: incomeLoading } = useIncomeSummary();
  const { data: expenseTrends, isLoading: trendsLoading } = useExpenseTrends(months);
  const { data: incomeVsExpense, isLoading: comparisonLoading } = useIncomeVsExpense(months);
  const { data: accountAnalytics, isLoading: accountLoading } = useAccountAnalytics();
  const { data: spendingByTags, isLoading: tagsLoading } = useSpendingByTags(months);
  const { data: incomeByTags, isLoading: incomeTagsLoading } = useIncomeByTags(months);
  const { data: investmentOverview, isLoading: investmentOverviewLoading } = useInvestmentOverview();
  const { data: investmentTrends, isLoading: investmentTrendsLoading } = useInvestmentTrends(months);
  const { data: investmentPerformance, isLoading: investmentPerformanceLoading } = useInvestmentPerformance();
  const { data: profile } = useProfile();

  const currency = profile?.user?.default_currency || 'USD';

  const isLoading = expenseLoading || incomeLoading || trendsLoading || comparisonLoading || accountLoading || tagsLoading || incomeTagsLoading || investmentOverviewLoading || investmentTrendsLoading || investmentPerformanceLoading;

  // Calculate net worth and financial health
  const netWorth = accountAnalytics?.netWorth || 0;
  const totalAssets = accountAnalytics?.totalAssets || 0;
  const totalLiabilities = accountAnalytics?.totalLiabilities || 0;
  const creditUtilization = accountAnalytics?.creditCards?.utilization_percentage || 0;

  // Format monthly data for charts
  const monthlyTrendData = useMemo(() => {
    if (!expenseTrends?.monthly_expenses) return [];
    return expenseTrends.monthly_expenses.map(item => ({
      month: item.month,
      amount: Number(item.total),
    }));
  }, [expenseTrends]);

  // Format income vs expense data
  const incomeExpenseData = useMemo(() => {
    if (!incomeVsExpense?.comparison) return [];
    return incomeVsExpense.comparison.map(item => ({
      month: item.month,
      income: item.income,
      expense: item.expense,
      net: item.net,
    }));
  }, [incomeVsExpense]);

  // Format account type distribution for pie chart
  const accountDistributionData = useMemo(() => {
    if (!accountAnalytics?.by_type) return [];
    return accountAnalytics.by_type.map(item => ({
      name: item.type.replace('_', ' '),
      value: item.total_balance,
    }));
  }, [accountAnalytics]);

  // Calculate totals
  const totalExpenses = expenseSummary?.summary?.total_amount || 0;
  const totalIncomes = incomeSummary?.summary?.total_amount || 0;
  const netSavings = incomeVsExpense?.summary?.net_savings || 0;
  const savingsRate = incomeVsExpense?.summary?.overall_savings_rate || 0;

  // Category colors
  const getCategoryColor = (index: number) => COLORS[index % COLORS.length];

  // Format tag spending data
  const tagSpendingData = useMemo(() => {
    if (!spendingByTags?.by_tags) return [];
    return spendingByTags.by_tags.filter(tag => tag.tag_id).map(tag => ({
      name: tag.tag_name,
      value: Number(tag.total),
      color: tag.tag_color || COLORS[0],
    }));
  }, [spendingByTags]);

  // Format income by tags data
  const incomeByTagsData = useMemo(() => {
    if (!incomeByTags?.by_tags) return [];
    return incomeByTags.by_tags.filter(tag => tag.tag_id).map(tag => ({
      name: tag.tag_name,
      value: Number(tag.total),
      color: tag.tag_color || COLORS[0],
    }));
  }, [incomeByTags]);

  // Get unique colors for tags
  const tagColors = useMemo(() => {
    if (!spendingByTags?.by_tags) return {};
    const colors: Record<string, string> = {};
    spendingByTags.by_tags.forEach(tag => {
      if (tag.tag_id) {
        colors[tag.tag_name] = tag.tag_color || COLORS[0];
      }
    });
    return colors;
  }, [spendingByTags]);

  // Investment analytics data
  const investmentSummary = investmentOverview?.summary;
  const investmentByType = investmentOverview?.by_type || [];
  const investmentByStatus = investmentOverview?.by_status || [];
  const sipSummary = investmentOverview?.sip_summary;

  // Format investment trends data
  const investmentTrendData = useMemo(() => {
    if (!investmentTrends?.monthly_investments) return [];
    return investmentTrends.monthly_investments.map(item => ({
      month: item.month,
      amount: Number(item.total),
    }));
  }, [investmentTrends]);

  // Format investment type distribution for pie chart
  const investmentTypeData = useMemo(() => {
    if (!investmentByType) return [];
    return investmentByType.map((item, index) => ({
      name: item.investment_type,
      value: item.current_value,
    }));
  }, [investmentByType]);

  // Format investment performance data
  const investmentPerformanceData = useMemo(() => {
    if (!investmentPerformance?.performance) return [];
    return investmentPerformance.performance.map(item => ({
      type: item.type,
      invested: item.total_invested,
      currentValue: item.current_value,
      returns: item.total_returns,
      returnsPercentage: item.returns_percentage,
    }));
  }, [investmentPerformance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Financial insights and trends</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Week
          </Button>
          <Button
            variant={period === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Month
          </Button>
          <Button
            variant={period === 'year' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Net Worth and Financial Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={netWorth >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Net Worth</div>
            <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netWorth, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Assets: {formatCurrency(totalAssets, currency)} | Liabilities: {formatCurrency(totalLiabilities, currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Total Income</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncomes, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {incomeSummary?.summary?.total_count || 0} transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {expenseSummary?.summary?.total_count || 0} transactions
            </div>
          </CardContent>
        </Card>

        <Card className={savingsRate >= 0 ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-red-500'}>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Net Savings</div>
            <div className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netSavings, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Savings Rate: {savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Utilization and Debt */}
      {accountAnalytics?.creditCards?.cards && accountAnalytics.creditCards.cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountAnalytics.creditCards.cards.map((card) => (
            <Card key={card.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{card.name}</div>
                  <div className={`text-sm px-2 py-1 rounded ${
                    card.utilization < 30 ? 'bg-green-100 text-green-800' :
                    card.utilization < 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {card.utilization.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance</span>
                    <span className="font-medium">{formatCurrency(card.balance, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available</span>
                    <span className="font-medium">{formatCurrency(card.available_credit, currency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        card.utilization < 30 ? 'bg-green-500' :
                        card.utilization < 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(card.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Income vs Expense Chart */}
      {incomeExpenseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value as number, currency)} />
                  <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expense" fill="#EF4444" name="Expenses" />
                  <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {monthlyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value as number, currency)} />
                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                    <Legend />
                    <Bar dataKey="amount" fill="#3B82F6" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Account Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {accountDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {accountDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No account data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseSummary?.by_category && expenseSummary.by_category.length > 0 ? (
              <div className="space-y-3">
                {expenseSummary.by_category.slice(0, 8).map((cat, index) => {
                  const percentage = totalExpenses > 0
                    ? (Number(cat.total) / totalExpenses) * 100
                    : 0;
                  return (
                    <div key={cat.category || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(index) }}
                          />
                          {cat.category || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(cat.total), currency)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(index),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeSummary?.by_category && incomeSummary.by_category.length > 0 ? (
              <div className="space-y-3">
                {incomeSummary.by_category.map((cat, index) => {
                  const percentage = totalIncomes > 0
                    ? (Number(cat.total) / totalIncomes) * 100
                    : 0;
                  return (
                    <div key={cat.category || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(index) }}
                          />
                          {cat.category || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(cat.total), currency)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all bg-green-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No income data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loans Summary */}
      {accountAnalytics?.loans && accountAnalytics.loans.accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loan Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3 font-medium">Loan</th>
                    <th className="px-4 py-3 font-medium text-right">Balance</th>
                    <th className="px-4 py-3 font-medium text-right">Original Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Interest Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Paid Off</th>
                  </tr>
                </thead>
                <tbody>
                  {accountAnalytics.loans.accounts.map((loan) => {
                    const paidOff = loan.loan_amount > 0
                      ? ((loan.loan_amount - loan.loan_balance) / loan.loan_amount) * 100
                      : 0;
                    return (
                      <tr key={loan.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{loan.name}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(loan.loan_balance, currency)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(loan.loan_amount, currency)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {loan.interest_rate ? `${loan.interest_rate}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${paidOff >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {paidOff.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-medium">Total</td>
                    <td className="px-4 py-3 font-medium text-right">{formatCurrency(accountAnalytics.loans.total_balance, currency)}</td>
                    <td className="px-4 py-3 font-medium text-right">{formatCurrency(accountAnalytics.loans.total_original_amount, currency)}</td>
                    <td className="px-4 py-3 font-medium text-right">-</td>
                    <td className="px-4 py-3 font-medium text-right">
                      {accountAnalytics.loans.total_original_amount > 0
                        ? (((accountAnalytics.loans.total_original_amount - accountAnalytics.loans.total_balance) / accountAnalytics.loans.total_original_amount) * 100).toFixed(1) + '%'
                        : '0%'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {expenseSummary?.by_category && expenseSummary.by_category.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseSummary.by_category.map((cat, index) => {
                    const percentage = totalExpenses > 0
                      ? (Number(cat.total) / totalExpenses) * 100
                      : 0;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(index) }}
                          />
                          {cat.category || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(Number(cat.total), currency)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending by Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Tags Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {spendingByTags?.by_tags && spendingByTags.by_tags.length > 0 ? (
              <div className="space-y-3">
                {spendingByTags.by_tags.filter(tag => tag.tag_id).slice(0, 10).map((tag, index) => {
                  const percentage = totalExpenses > 0
                    ? (Number(tag.total) / totalExpenses) * 100
                    : 0;
                  return (
                    <div key={tag.tag_id || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.tag_color || COLORS[index % COLORS.length] }}
                          />
                          {tag.tag_name || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(tag.total), currency)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: tag.tag_color || COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No tagged expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Tags Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Income by Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByTags?.by_tags && incomeByTags.by_tags.length > 0 ? (
              <div className="space-y-3">
                {incomeByTags.by_tags.filter(tag => tag.tag_id).slice(0, 10).map((tag, index) => {
                  const percentage = totalIncomes > 0
                    ? (Number(tag.total) / totalIncomes) * 100
                    : 0;
                  return (
                    <div key={tag.tag_id || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.tag_color || COLORS[index % COLORS.length] }}
                          />
                          {tag.tag_name || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(tag.total), currency)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all bg-green-500"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No tagged income data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tags Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Tags Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Tags Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {tagSpendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tagSpendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {tagSpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No tag data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Income Tags Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income Tags Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {incomeByTagsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByTagsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {incomeByTagsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No tag data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Analytics Section */}
      {investmentOverview && (() => {
        const hasInvestments = investmentSummary && investmentSummary.total_investments > 0;
        
        if (!hasInvestments) return null;
        
        return (
          <>
            {/* Investment Summary Cards */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Investment Analytics</h2>
                <p className="text-gray-500 mt-1">Track your investment performance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={investmentSummary.returns_percentage >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Total Investments</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(investmentSummary.total_invested, currency)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {investmentSummary.total_investments} investments
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Current Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(investmentSummary.current_value, currency)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Current worth
                  </div>
                </CardContent>
              </Card>

              <Card className={investmentSummary.returns_percentage >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Total Returns</div>
                  <div className={`text-2xl font-bold ${investmentSummary.total_returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(investmentSummary.total_returns, currency)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {investmentSummary.returns_percentage.toFixed(1)}% returns
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">SIP Summary</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {sipSummary?.total_sips || 0} SIPs
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {sipSummary?.total_installments || 0} installments
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investment Trends Chart */}
            {investmentTrendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Investment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={investmentTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value as number, currency)} />
                        <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                        <Legend />
                        <Bar dataKey="amount" fill="#8B5CF6" name="Investments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Distribution and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Investment by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Investment by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {investmentByType && investmentByType.length > 0 ? (
                    <div className="space-y-3">
                      {investmentByType.map((item, index) => {
                        const percentage = investmentSummary.total_invested > 0
                          ? (item.invested / investmentSummary.total_invested) * 100
                          : 0;
                        return (
                          <div key={item.investment_type || index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700 flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                {item.investment_type || 'Unknown'}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.invested, currency)} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No investment data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Investment Performance by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {investmentPerformanceData && investmentPerformanceData.length > 0 ? (
                    <div className="space-y-3">
                      {investmentPerformanceData.map((item, index) => (
                        <div key={item.type || index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{item.type || 'Unknown'}</span>
                            <span className={`text-sm font-medium ${item.returnsPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.returnsPercentage >= 0 ? '+' : ''}{item.returnsPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Invested: {formatCurrency(item.invested, currency)}</span>
                            <span>Current: {formatCurrency(item.currentValue, currency)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Investment Type Pie Chart */}
            {investmentTypeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Investment Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={investmentTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {investmentTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
      })()}
    </div>
  );
}
