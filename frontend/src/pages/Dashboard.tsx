import { useAccounts, useAccountBalance, useExpenseSummary, useExpenses, useProfile } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Account } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function Dashboard() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: balanceData, isLoading: balanceLoading } = useAccountBalance();
  const { data: summaryData, isLoading: summaryLoading } = useExpenseSummary();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ limit: 5 });
  const { data: profileData } = useProfile();

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
  const currency = profileData?.user.default_currency || 'USD';

  // Filter credit cards
  const creditCards = accounts.filter(a => a.type === 'credit_card');

  // Calculate totals
  const totalCreditLimit = accounts
    .filter(a => a.type === 'credit_card' && a.details?.credit_limit)
    .reduce((sum, a) => sum + Number(a.details?.credit_limit || 0), 0);
  
  const totalAvailableCredit = accounts
    .filter(a => a.type === 'credit_card' && a.details?.available_credit)
    .reduce((sum, a) => sum + (Number(a.details?.available_credit || 0)), 0);
  
  const totalLoanBalance = accounts
    .filter(a => a.type === 'loan' && a.details?.loan_balance)
    .reduce((sum, a) => sum + Number(a.details?.loan_balance || 0), 0);

  const balanceBreakdown = accounts
    .filter(a => !['credit_card', 'loan'].includes(a.type))
    .map(a => ({
      name: a.name,
      value: Number(a.balance || 0),
      type: a.type,
    }))
    .filter(item => item.value !== 0);

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
              {formatCurrency(Number(balances.total_balance), currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Credit Limit Used</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalCreditLimit - totalAvailableCredit, currency)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <div>Available: {formatCurrency(totalAvailableCredit, currency)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Loan Balance</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalLoanBalance, currency)}
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
              {formatCurrency(Number(summary.total_amount), currency)}
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

      {/* Credit Cards Breakdown */}
      {creditCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Credit Cards - Expected Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditCards.map((card: Account) => {
                const creditLimit = Number(card.details?.credit_limit || 0);
                const availableCredit = Number(card.details?.available_credit || 0);
                const expectedBill = creditLimit - availableCredit;
                const utilizationPercent = creditLimit > 0 ? (expectedBill / creditLimit) * 100 : 0;

                return (
                  <div
                    key={card.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{card.name}</h3>
                        {card.institution_name && (
                          <p className="text-sm text-gray-500">{card.institution_name}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          utilizationPercent > 80
                            ? 'bg-red-100 text-red-700'
                            : utilizationPercent > 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {utilizationPercent.toFixed(0)}% used
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Expected Bill</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(expectedBill, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Available Credit</span>
                        <span className="text-sm text-gray-700">
                          {formatCurrency(availableCredit, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Credit Limit</span>
                        <span className="text-sm text-gray-700">
                          {formatCurrency(creditLimit, currency)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilizationPercent > 80
                                ? 'bg-red-500'
                                : utilizationPercent > 50
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                        {formatCurrency(expense.amount, currency)}
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
