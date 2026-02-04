import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncomes, useDeleteIncome, useProfile } from '../hooks';
import { Card, CardContent, Button, Alert, AlertDescription } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

export function Incomes() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useIncomes({ limit, offset: (page - 1) * limit });
  const deleteIncome = useDeleteIncome();
  const { data: profileData } = useProfile();
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const currency = profileData?.user.default_currency || 'USD';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this income?')) return;

    try {
      await deleteIncome.mutateAsync(id);
      setSuccessMessage('Income deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setDeleteError(axiosError.response?.data?.message || 'Failed to delete income');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incomes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incomes</h1>
          <p className="text-gray-500 mt-1">Manage your incomes</p>
        </div>
        <Link to="/incomes/new">
          <Button>Add Income</Button>
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
          {data?.incomes && data.incomes.length > 0 ? (
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
                  {data.incomes.map((income) => (
                    <tr key={income.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(income.income_date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {income.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {income.category_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {income.tags && income.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {income.tags.map((tag) => (
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
                        {income.account_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {formatCurrency(income.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/incomes/${income.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            disabled={deleteIncome.isPending}
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
              <p className="text-gray-500 mb-4">No incomes found</p>
              <Link to="/incomes/new">
                <Button>Add your first income</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.incomes.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1} to {page * limit} incomes
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
              disabled={data.incomes.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
