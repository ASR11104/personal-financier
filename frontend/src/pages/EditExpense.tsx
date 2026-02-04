import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExpense, useUpdateExpense, useCategories, useTags, useAccounts } from '../hooks';
import { Button, Card, Input, Select, MultiSelect, Alert, AlertDescription } from '../components/ui';

export function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: '',
    category_id: '',
    tag_ids: [] as string[],
    credit_card_account_id: '',
    loan_account_id: '',
  });
  const [error, setError] = useState('');

  const { data: expenseData, isLoading } = useExpense(id || '');
  const { data: categoriesData } = useCategories({ type: 'expense' });
  const { data: tagsData } = useTags();
  const { data: accountsData } = useAccounts();
  const updateExpense = useUpdateExpense();

  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];
  const accounts = accountsData?.accounts || [];

  // Filter credit card and loan accounts for bill payments
  const creditCardAccounts = accounts.filter((acc) => acc.type === 'credit_card');
  const loanAccounts = accounts.filter((acc) => acc.type === 'loan');

  useEffect(() => {
    if (expenseData?.expense) {
      setFormData({
        amount: String(expenseData.expense.amount),
        description: expenseData.expense.description || '',
        expense_date: expenseData.expense.expense_date.split('T')[0],
        category_id: expenseData.expense.category_id || '',
        tag_ids: expenseData.expense.tags?.map((t) => t.id) || [],
        credit_card_account_id: expenseData.expense.credit_card_account_id || '',
        loan_account_id: expenseData.expense.loan_account_id || '',
      });
    }
  }, [expenseData]);

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
      await updateExpense.mutateAsync({
        id,
        params: {
          amount: Number(formData.amount),
          description: formData.description || undefined,
          expense_date: formData.expense_date,
          category_id: formData.category_id || undefined,
          tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : [],
          credit_card_account_id: formData.credit_card_account_id || undefined,
          loan_account_id: formData.loan_account_id || undefined,
        },
      });
      navigate('/expenses');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update expense');
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const creditCardOptions = creditCardAccounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
  }));

  const loanOptions = loanAccounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
  }));

  if (isLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!expenseData?.expense) {
    return <div className="text-gray-500">Expense not found</div>;
  }

  // Check if selected category is Credit Card or Loan to show relevant fields
  const selectedCategory = categories.find((cat) => cat.id === formData.category_id);
  const isCreditCardCategory = selectedCategory?.name === 'Credit Card';
  const isLoanCategory = selectedCategory?.name === 'Loan';

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

          {/* Credit Card Bill Payment - show credit card selection */}
          {isCreditCardCategory && (
            <Select
              label="Credit Card (for bill payment)"
              name="credit_card_account_id"
              value={formData.credit_card_account_id}
              onChange={handleChange}
              options={creditCardOptions}
              placeholder="Select credit card"
            />
          )}

          {/* Loan Payment - show loan selection */}
          {isLoanCategory && (
            <Select
              label="Loan (for payment)"
              name="loan_account_id"
              value={formData.loan_account_id}
              onChange={handleChange}
              options={loanOptions}
              placeholder="Select loan"
            />
          )}

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
