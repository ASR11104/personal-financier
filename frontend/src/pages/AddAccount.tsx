import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAccount } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';

export function AddAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '' as 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | '',
    currency: 'USD',
    institution_name: '',
    balance: '',
  });
  const [error, setError] = useState('');

  const createAccount = useCreateAccount();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createAccount.mutateAsync({
        name: formData.name,
        type: formData.type as 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan',
        currency: formData.currency,
        institution_name: formData.institution_name || undefined,
        balance: formData.balance ? Number(formData.balance) : undefined,
      });
      navigate('/accounts');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create account');
    }
  };

  const typeOptions = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'investment', label: 'Investment' },
    { value: 'loan', label: 'Loan' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Account</h1>
        <p className="text-gray-500 mt-1">Create a new financial account</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Main Checking"
            required
          />

          <Select
            label="Account Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={typeOptions}
            placeholder="Select account type"
            required
          />

          <Select
            label="Currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            options={currencyOptions}
            required
          />

          <Input
            label="Initial Balance"
            type="number"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
          />

          <Input
            label="Institution Name"
            name="institution_name"
            value={formData.institution_name}
            onChange={handleChange}
            placeholder="e.g., Chase Bank"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={createAccount.isPending}>
              Create Account
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
