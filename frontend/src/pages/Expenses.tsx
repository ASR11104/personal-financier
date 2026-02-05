import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses, useDeleteExpense, useProfile, useCategories, useTags, useAccounts } from '../hooks';
import { Card, CardContent, Button, Alert, AlertDescription, Select, Input } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

export function Expenses() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
    tag_id: '',
    account_id: '',
  });
  const { data: profileData } = useProfile();
  const { data: categoriesData } = useCategories();
  const { data: tagsData } = useTags();
  const { data: accountsData } = useAccounts();
  const deleteExpense = useDeleteExpense();
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const currency = profileData?.user.default_currency || 'USD';

  const { data, isLoading } = useExpenses({ 
    limit, 
    offset: (page - 1) * limit,
    ...filters 
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      category_id: '',
      tag_id: '',
      account_id: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteExpense.mutateAsync(id);
      setSuccessMessage('Expense deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setDeleteError(axiosError.response?.data?.message || 'Failed to delete expense');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Manage your expenses</p>
        </div>
        <Link to="/expenses/new">
          <Button>Add Expense</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <Input
                type="date"
                label="Start Date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div className="w-40">
              <Input
                type="date"
                label="End Date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Category"
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                options={(categoriesData?.categories || []).map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                placeholder="All Categories"
              />
            </div>
            <div className="w-48">
              <Select
                label="Tag"
                value={filters.tag_id}
                onChange={(e) => handleFilterChange('tag_id', e.target.value)}
                options={(tagsData?.tags || []).map((tag) => ({
                  value: tag.id,
                  label: tag.name,
                }))}
                placeholder="All Tags"
              />
            </div>
            <div className="w-48">
              <Select
                label="Account"
                value={filters.account_id}
                onChange={(e) => handleFilterChange('account_id', e.target.value)}
                options={(accountsData?.accounts || []).map((acc) => ({
                  value: acc.id,
                  label: acc.name,
                }))}
                placeholder="All Accounts"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {deleteError && (
        <Alert variant="error">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {data?.expenses && data.expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.category_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.tags && expense.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {expense.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `${tag.color}30`,
                                  color: '#1f2937',
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full mr-1"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.account_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(expense.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/expenses/${expense.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            disabled={deleteExpense.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No expenses found</p>
              <Link to="/expenses/new">
                <Button>Add your first expense</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.expenses.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {Math.min((page - 1) * limit + 1, data.total)} to {Math.min(page * limit, data.total)} of {data.total} expenses
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
