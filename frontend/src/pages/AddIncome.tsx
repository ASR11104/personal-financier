import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateIncome, useAccounts, useCategories, useTags } from '../hooks';
import { Button, Card, Input, Select, MultiSelect, Alert, AlertDescription } from '../components/ui';

export function AddIncome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    account_id: location.state?.account_id || '',
    category_id: '',
    amount: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0],
    tag_ids: [] as string[],
  });
  const [error, setError] = useState('');

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: categoriesData } = useCategories({ type: 'income' });
  const { data: tagsData } = useTags();
  const createIncome = useCreateIncome();

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagIds: string[]) => {
    setFormData((prev) => ({ ...prev, tag_ids: tagIds }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createIncome.mutateAsync({
        account_id: formData.account_id,
        category_id: formData.category_id,
        amount: Number(formData.amount),
        description: formData.description || undefined,
        income_date: formData.income_date,
        tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : undefined,
      });
      navigate('/incomes');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create income');
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

  if (accountsLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Income</h1>
        <p className="text-gray-500 mt-1">Record a new income</p>
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

          {/* Tags Section */}
          <MultiSelect
            label="Tags"
            options={tags}
            value={formData.tag_ids}
            onChange={handleTagToggle}
            placeholder="Select tags"
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
            name="income_date"
            value={formData.income_date}
            onChange={handleChange}
            required
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What was this income for?"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={createIncome.isPending}>
              Save Income
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/incomes')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
