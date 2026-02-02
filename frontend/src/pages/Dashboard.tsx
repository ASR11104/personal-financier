import { useAccounts, useAccountBalance, useExpenseSummary, useExpenses } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Dashboard() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: balanceData, isLoading: balanceLoading } = useAccountBalance();
  const { data: summaryData, isLoading: summaryLoading } = useExpenseSummary();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ limit: 5 });

  if (accountsLoading || balanceLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const balances = balanceData?.balances || {
    total_balance: 0,
    checking: 0,
    savings: 0,
    credit_card: 0,
    cash: 0,
    investment: 0,
    loan: 0,
  };

  const summary = summaryData?.summary || { total_count: 0, total_amount: 0 };
  const categoryData = summaryData?.by_category || [];

  const accounts = accountsData?.accounts || [];
  
  // Calculate totals
  const totalCreditLimit = accounts
    .filter(a => a.type === 'credit_card' && a.details?.credit_limit)
    .reduce((sum, a) => sum + (a.details?.credit_limit || 0), 0);
  
  const totalAvailableCredit = accounts
    .filter(a => a.type === 'credit_card' && a.details?.credit_limit)
    .reduce((sum, a) => sum + ((a.details?.credit_limit || 0) - a.balance), 0);
  
  const totalLoanBalance = accounts
    .filter(a => a.type === 'loan' && a.details?.loan_balance)
    .reduce((sum, a) => sum + (a.details?.loan_balance || 0), 0);

  const balanceBreakdown = [
    { name: 'Checking', value: Number(balances.checking) },
    { name: 'Savings', value: Number(balances.savings) },
    { name: 'Cash', value: Number(balances.cash) },
    { name: 'Investment', value: Number(balances.investment) },
  ].filter((item) => item.value !== 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your finances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Total Balance</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(Number(balances.total_balance))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Credit Limit</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalCreditLimit)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Available: {formatCurrency(totalAvailableCredit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Loan Balance</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalLoanBalance)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {accounts.filter(a => a.type === 'loan').length} loans
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Total Expenses</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(Number(summary.total_amount))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {summary.total_count} transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Balance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={balanceBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {balanceBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No account data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="category"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : expensesData?.expenses && expensesData.expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesData.expenses.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="py-3 text-sm">
                        {expense.description || '-'}
                      </td>
                      <td className="py-3 text-sm">
                        {expense.category_name || '-'}
                      </td>
                      <td className="py-3 text-sm text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No expenses yet. Start tracking your spending!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
