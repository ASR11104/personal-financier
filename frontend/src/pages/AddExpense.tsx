import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateExpense, useAccounts, useCategories, useSubCategories } from '../hooks';
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
  const { data: categoriesData } = useCategories({ type: 'expense' });
  const { data: subCategoriesData } = useSubCategories(
    formData.category_id ? { category_id: formData.category_id } : undefined
  );
  const createExpense = useCreateExpense();

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];
  const subCategories = subCategoriesData?.sub_categories || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Reset subcategory when category changes
      if (name === 'category_id') {
        newData.sub_category_id = '';
      }
      return newData;
    });
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

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const subCategoryOptions = subCategories.map((subCat) => ({
    value: subCat.id,
    label: subCat.name,
  }));

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

          <Select
            label="SubCategory"
            name="sub_category_id"
            value={formData.sub_category_id}
            onChange={handleChange}
            options={subCategoryOptions}
            placeholder="Select a subcategory (optional)"
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
