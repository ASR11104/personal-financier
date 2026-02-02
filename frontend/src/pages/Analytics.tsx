import { useState } from 'react';
import { useExpenseSummary } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data, isLoading } = useExpenseSummary();

  const summary = data?.summary || { total_count: 0, total_amount: 0 };
  const categoryData = data?.by_category || [];

  // Mock data for bar chart - in real app, would come from API
  const monthlyData = [
    { month: 'Jan', amount: 1200 },
    { month: 'Feb', amount: 1800 },
    { month: 'Mar', amount: 1400 },
    { month: 'Apr', amount: 2200 },
    { month: 'May', amount: 1900 },
    { month: 'Jun', amount: 2500 },
  ];

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Average per Transaction</div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.total_count > 0
                ? formatCurrency(Number(summary.total_amount) / summary.total_count)
                : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500 mb-1">Categories</div>
            <div className="text-2xl font-bold text-gray-900">
              {categoryData.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Active categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#3B82F6" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-3">
                {categoryData.slice(0, 6).map((cat, index) => {
                  const percentage = summary.total_amount > 0
                    ? (Number(cat.total) / Number(summary.total_amount)) * 100
                    : 0;
                  return (
                    <div key={cat.category || index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">
                          {cat.category || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(cat.total))} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
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
      </div>

      {/* Top Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categoryData.length > 0 ? (
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
                  {categoryData.map((cat, index) => {
                    const percentage = summary.total_amount > 0
                      ? (Number(cat.total) / Number(summary.total_amount)) * 100
                      : 0;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {cat.category || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(Number(cat.total))}
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
    </div>
  );
}
