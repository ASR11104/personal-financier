import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select } from '../components/ui';
import { accountApi } from '../api/account';
import { useAccounts } from '../hooks/useAccount';

export function Transfer() {
  const navigate = useNavigate();
  const { data: accountsData, isLoading: accountsLoading } = useAccounts({ is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  const accounts = accountsData?.accounts || [];

  // Filter out the selected "from" account from the "to" account options
  const toAccountOptions = accounts
    .filter(account => account.id !== fromAccountId)
    .map(account => ({
      value: account.id,
      label: `${account.name} (${account.type}) - ${account.currency} ${Number(account.balance).toFixed(2)}`,
    }));

  const fromAccountOptions = accounts.map(account => ({
    value: account.id,
    label: `${account.name} (${account.type}) - ${account.currency} ${Number(account.balance).toFixed(2)}`,
  }));

  const selectedFromAccount = accounts.find(a => a.id === fromAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromAccountId || !toAccountId || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    // Check if sufficient balance
    if (selectedFromAccount) {
      if (selectedFromAccount.type === 'credit_card') {
        const availableCredit = selectedFromAccount.details?.available_credit || 0;
        if (parsedAmount > availableCredit) {
          setError('Insufficient credit available');
          return;
        }
      } else {
        if (parsedAmount > Number(selectedFromAccount.balance)) {
          setError('Insufficient balance');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      await accountApi.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: parsedAmount,
        description: description || undefined,
        transfer_date: transferDate,
      });

      navigate('/accounts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accounts.length < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Transfer Money</h2>
            <p className="text-gray-600 mb-4">
              You need at least two accounts to transfer money between them.
            </p>
            <Button onClick={() => navigate('/accounts/new')}>
              Add New Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transfer Money</h1>
          <p className="text-gray-600 mt-1">Move money between your accounts</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="From Account"
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            options={fromAccountOptions}
            placeholder="Select source account"
            required
          />

          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          <Select
            label="To Account"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            options={toAccountOptions}
            placeholder="Select destination account"
            required
            disabled={!fromAccountId}
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <Input
            label="Transfer Date"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            required
          />

          <Input
            label="Description (Optional)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Moving savings to checking"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Transferring...' : 'Transfer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/accounts')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
