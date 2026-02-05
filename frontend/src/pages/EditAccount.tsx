import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccount, useUpdateAccount } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';

export function EditAccount() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAccount(id || '');
  const updateAccount = useUpdateAccount();
  const [formData, setFormData] = useState({
    name: '',
    type: '' as 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan' | '',
    currency: 'USD',
    institution_name: '',
    balance: '',
    is_active: true,
    // Credit card fields
    credit_limit: '',
    // Loan fields
    loan_amount: '',
    loan_balance: '',
    interest_rate: '',
    loan_term_months: '',
    loan_start_date: '',
    loan_due_date: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form when data loads
  useEffect(() => {
    if (data?.account) {
      const account = data.account;
      setFormData(prev => ({
        ...prev,
        name: account.name,
        type: account.type as 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan',
        currency: account.currency,
        institution_name: account.institution_name || '',
        balance: account.balance.toString(),
        is_active: account.is_active,
        credit_limit: account.details?.credit_limit?.toString() || '',
        loan_amount: account.details?.loan_amount?.toString() || '',
        loan_balance: account.details?.loan_balance?.toString() || '',
        interest_rate: account.details?.interest_rate?.toString() || '',
        loan_term_months: account.details?.loan_term_months?.toString() || '',
        loan_start_date: account.details?.loan_start_date?.split('T')[0] || '',
        loan_due_date: account.details?.loan_due_date?.split('T')[0] || '',
      }));
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!id) return;

    const { type } = formData;
    const details: any = {};

    // Only include details based on account type
    if (type === 'credit_card') {
      if (formData.credit_limit) {
        details.credit_limit = Number(formData.credit_limit);
      }
    } else if (type === 'loan') {
      if (formData.loan_amount) details.loan_amount = Number(formData.loan_amount);
      if (formData.loan_balance) details.loan_balance = Number(formData.loan_balance);
      if (formData.interest_rate) details.interest_rate = Number(formData.interest_rate);
      if (formData.loan_term_months) details.loan_term_months = Number(formData.loan_term_months);
      if (formData.loan_start_date) details.loan_start_date = formData.loan_start_date;
      if (formData.loan_due_date) details.loan_due_date = formData.loan_due_date;
    }

    try {
      await updateAccount.mutateAsync({
        id,
        params: {
          name: formData.name,
          type: formData.type as 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan',
          currency: formData.currency,
          institution_name: formData.institution_name || undefined,
          is_active: formData.is_active,
          balance: formData.balance ? Number(formData.balance) : undefined,
          details: Object.keys(details).length > 0 ? details : undefined,
        },
      });
      navigate('/accounts');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setErrorMessage(axiosError.response?.data?.message || 'Failed to update account');
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
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
  ];

  const showCreditCardFields = formData.type === 'credit_card';
  const showLoanFields = formData.type === 'loan';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading account...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="error">
          <AlertDescription>Failed to load account</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
        <p className="text-gray-500 mt-1">Update your financial account</p>
      </div>

      <Card>
        {errorMessage && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
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
            label="Balance"
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

          {/* Credit Card Fields */}
          {showCreditCardFields && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Credit Card Details</h3>
              <Input
                label="Credit Limit"
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          )}

          {/* Loan Fields */}
          {showLoanFields && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Loan Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Loan Amount"
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <Input
                  label="Remaining Balance"
                  type="number"
                  name="loan_balance"
                  value={formData.loan_balance}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Interest Rate (%)"
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.0000000001"
                  min="0"
                />
                <Input
                  label="Term (months)"
                  type="number"
                  name="loan_term_months"
                  value={formData.loan_term_months}
                  onChange={handleChange}
                  placeholder="e.g., 12"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Start Date"
                  type="date"
                  name="loan_start_date"
                  value={formData.loan_start_date}
                  onChange={handleChange}
                />
                <Input
                  label="Due Date"
                  type="date"
                  name="loan_due_date"
                  value={formData.loan_due_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Account is active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={updateAccount.isPending}>
              Save Changes
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
