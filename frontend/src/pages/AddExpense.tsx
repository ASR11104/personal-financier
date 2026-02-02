import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateExpense, useAccounts } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';

export function AddExpense() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    account_id: location.state?.account_id || '',
    category_id: '',
    sub_category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const createExpense = useCreateExpense();

  const accounts = accountsData?.accounts || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createExpense.mutateAsync({
        account_id: formData.account_id,
        category_id: formData.category_id,
        sub_category_id: formData.sub_category_id || undefined,
        amount: Number(formData.amount),
        description: formData.description || undefined,
        expense_date: formData.expense_date,
      });
      navigate('/expenses');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create expense');
    }
  };

  const accountOptions = accounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.type})`,
  }));

  // Mock categories - in real app, fetch from API
  const categoryOptions = [
    { value: '1', label: 'Food & Dining' },
    { value: '2', label: 'Transportation' },
    { value: '3', label: 'Shopping' },
    { value: '4', label: 'Entertainment' },
    { value: '5', label: 'Bills & Utilities' },
    { value: '6', label: 'Healthcare' },
    { value: '7', label: 'Education' },
    { value: '8', label: 'Travel' },
    { value: '9', label: 'Other' },
  ];

  if (accountsLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-500 mt-1">Record a new expense</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Account"
            name="account_id"
            value={formData.account_id}
            onChange={handleChange}
            options={accountOptions}
            placeholder="Select an account"
            required
          />

          <Select
            label="Category"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select a category"
            required
          />

          <Input
            label="Amount"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
          />

          <Input
            label="Date"
            type="date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            required
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What was this expense for?"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={createExpense.isPending}>
              Save Expense
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/expenses')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
