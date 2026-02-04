import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncome, useUpdateIncome, useCategories, useTags } from '../hooks';
import { Button, Card, Input, Select, MultiSelect, Alert, AlertDescription } from '../components/ui';

export function EditIncome() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    income_date: '',
    category_id: '',
    tag_ids: [] as string[],
  });
  const [error, setError] = useState('');

  const { data: incomeData, isLoading } = useIncome(id || '');
  const { data: categoriesData } = useCategories({ type: 'income' });
  const { data: tagsData } = useTags();
  const updateIncome = useUpdateIncome();

  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];

  useEffect(() => {
    if (incomeData?.income) {
      setFormData({
        amount: String(incomeData.income.amount),
        description: incomeData.income.description || '',
        income_date: incomeData.income.income_date.split('T')[0],
        category_id: incomeData.income.category_id || '',
        tag_ids: incomeData.income.tags?.map((t) => t.id) || [],
      });
    }
  }, [incomeData]);

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

    if (!id) return;

    try {
      await updateIncome.mutateAsync({
        id,
        params: {
          amount: Number(formData.amount),
          description: formData.description || undefined,
          income_date: formData.income_date,
          category_id: formData.category_id || undefined,
          tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : [],
        },
      });
      navigate('/incomes');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update income');
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  if (isLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!incomeData?.income) {
    return <div className="text-gray-500">Income not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Income</h1>
        <p className="text-gray-500 mt-1">Update income details</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Account: {incomeData.income.account_name || 'Unknown'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            options={categoryOptions}
            placeholder="Select a category"
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
            <Button type="submit" isLoading={updateIncome.isPending}>
              Update Income
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
