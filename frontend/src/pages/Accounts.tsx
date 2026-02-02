import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccounts, useDeleteAccount } from '../hooks';
import { Card, CardContent, Button, Alert, AlertDescription } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/format';

export function Accounts() {
  const { data, isLoading, error } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const [deleteError, setDeleteError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      await deleteAccount.mutateAsync(id);
      setSuccessMessage('Account deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setDeleteError(axiosError.response?.data?.message || 'Failed to delete account');
    }
  };

  const accounts = data?.accounts || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    );
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit_card':
        return '💳';
      case 'cash':
        return '💵';
      case 'investment':
        return '📈';
      case 'loan':
        return '📋';
      default:
        return '🏛️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your financial accounts</p>
        </div>
        <Link to="/accounts/new">
          <Button>Add Account</Button>
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

      {error && (
        <Alert variant="error">
          <AlertDescription>Failed to load accounts</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>

                {account.institution_name && (
                  <p className="mt-2 text-sm text-gray-500">
                    {account.institution_name}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Updated {formatDate(account.updated_at)}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/accounts/${account.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                      disabled={deleteAccount.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No accounts found</p>
                <Link to="/accounts/new">
                  <Button>Add your first account</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
