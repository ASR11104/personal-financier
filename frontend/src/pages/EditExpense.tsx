import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExpense, useUpdateExpense } from '../hooks';
import { Button, Card, Input, Alert, AlertDescription } from '../components/ui';

export function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: '',
  });
  const [error, setError] = useState('');

  const { data: expenseData, isLoading } = useExpense(id || '');
  const updateExpense = useUpdateExpense();

  useEffect(() => {
    if (expenseData?.expense) {
      setFormData({
        amount: String(expenseData.expense.amount),
        description: expenseData.expense.description || '',
        expense_date: expenseData.expense.expense_date.split('T')[0],
      });
    }
  }, [expenseData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id) return;

    try {
      await updateExpense.mutateAsync({
        id,
        params: {
          amount: Number(formData.amount),
          description: formData.description || undefined,
          expense_date: formData.expense_date,
        },
      });
      navigate('/expenses');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update expense');
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!expenseData?.expense) {
    return <div className="text-gray-500">Expense not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
        <p className="text-gray-500 mt-1">Update expense details</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Account: {expenseData.expense.account_name || 'Unknown'}</p>
          <p className="text-sm text-gray-500">Category: {expenseData.expense.category_name || 'Unknown'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" isLoading={updateExpense.isPending}>
              Update Expense
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
