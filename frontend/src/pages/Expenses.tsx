import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses, useDeleteExpense } from '../hooks';
import { Card, CardContent, Button, Alert, AlertDescription } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

export function Expenses() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useExpenses({ limit, offset: (page - 1) * limit });
  const deleteExpense = useDeleteExpense();
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
                        {expense.account_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(expense.amount)}
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
            Showing {(page - 1) * limit + 1} to {page * limit} expenses
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
              disabled={data.expenses.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
