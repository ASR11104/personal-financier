import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccounts, useInvestmentTypes, useCreateInvestment } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';

interface FormData {
  account_id: string;
  investment_type_id: string;
  name: string;
  amount: string;
  units: string;
  purchase_price: string;
  purchase_date: string;
  description: string;
  is_sip: boolean;
  sip_amount: string;
  sip_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  sip_start_date: string;
  sip_end_date: string;
  sip_day_of_month: string;
  sip_total_installments: string;
  is_existing: boolean;
  is_emergency_fund: boolean;
}

export function AddInvestment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<FormData>({
    account_id: location.state?.account_id || '',
    investment_type_id: '',
    name: '',
    amount: '',
    units: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: '',
    is_sip: false,
    sip_amount: '',
    sip_frequency: 'monthly',
    sip_start_date: new Date().toISOString().split('T')[0],
    sip_end_date: '',
    sip_day_of_month: '1',
    sip_total_installments: '',
    is_existing: false,
    is_emergency_fund: false,
  });
  const [error, setError] = useState('');

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: typesData, isLoading: typesLoading } = useInvestmentTypes();
  const createInvestment = useCreateInvestment();

  const accounts = accountsData?.accounts || [];
  const investmentTypes = typesData?.investment_types || [];

  const eligibleAccounts = accounts.filter((acc) =>
    ['checking', 'savings', 'cash'].includes(acc.type)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate account_id is provided for new investments
    if (!formData.is_existing && !formData.account_id) {
      setError('Please select a source account for the investment');
      return;
    }

    try {
      const params: any = {
        investment_type_id: formData.investment_type_id,
        name: formData.name,
        description: formData.description || undefined,
        is_existing: formData.is_existing,
        is_emergency_fund: formData.is_emergency_fund,
      };

      // Only include account_id for new investments
      if (!formData.is_existing && formData.account_id) {
        params.account_id = formData.account_id;
      }

      if (formData.is_sip) {
        params.is_sip = true;
        params.sip_amount = Number(formData.sip_amount);
        params.sip_frequency = formData.sip_frequency;
        params.sip_start_date = formData.sip_start_date;
        params.sip_day_of_month = parseInt(formData.sip_day_of_month);
        if (formData.sip_end_date) {
          params.sip_end_date = formData.sip_end_date;
        }
        if (formData.sip_total_installments) {
          params.sip_total_installments = parseInt(formData.sip_total_installments);
        }
        // Set purchase_date to sip_start_date for SIP
        params.purchase_date = formData.sip_start_date;
      } else {
        params.amount = Number(formData.amount);
        params.purchase_date = formData.purchase_date;
        if (formData.units) {
          params.units = formData.units;
        }
        if (formData.purchase_price) {
          params.purchase_price = Number(formData.purchase_price);
        }
      }

      await createInvestment.mutateAsync(params);
      navigate('/investments');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to create investment');
    }
  };

  const accountOptions = eligibleAccounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.type}) - Balance: ${Number(acc.balance).toFixed(2)} ${acc.currency}`,
  }));

  const typeOptions = investmentTypes.map((type) => ({
    value: type.id,
    label: type.name.charAt(0).toUpperCase() + type.name.replace('_', ' ').slice(1),
  }));

  if (accountsLoading || typesLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Investment</h1>
        <p className="text-gray-500 mt-1">Record a new investment purchase</p>
      </div>

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Account - only shown for new investments */}
          {!formData.is_existing && (
            <Select
              label="Source Account"
              name="account_id"
              value={formData.account_id}
              onChange={handleInputChange}
              options={accountOptions}
              placeholder="Select source account"
              required
            />
          )}

          <Select
            label="Investment Type"
            name="investment_type_id"
            value={formData.investment_type_id}
            onChange={handleInputChange}
            options={typeOptions}
            placeholder="Select investment type"
            required
          />

          <Input
            label="Investment Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Apple Inc. Stock, Vanguard Mutual Fund"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount Invested"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required={!formData.is_sip}
              disabled={formData.is_sip}
            />

            <Input
              label="Purchase Date"
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleInputChange}
              required={!formData.is_sip}
              disabled={formData.is_sip}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Units (Optional)"
              name="units"
              value={formData.units}
              onChange={handleInputChange}
              placeholder="e.g., 10 shares"
              disabled={formData.is_sip}
            />

            <Input
              label="Purchase Price per Unit (Optional)"
              type="number"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleInputChange}
              placeholder="0.0000"
              step="0.0001"
              min="0"
              disabled={formData.is_sip}
            />
          </div>

          <Input
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Additional notes about this investment"
          />

          {/* Existing Investment Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="is_existing"
                id="is_existing"
                checked={formData.is_existing}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_existing" className="ml-2 block text-sm font-medium text-gray-900">
                This is an existing investment (won't affect account balance)
              </label>
            </div>

            {formData.is_existing && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  This investment was made in the past. The investment will be recorded but no money will be deducted from your account balance.
                </p>
              </div>
            )}
          </div>

          {/* Emergency Fund Flag */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                name="is_emergency_fund"
                id="is_emergency_fund"
                checked={formData.is_emergency_fund}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_emergency_fund" className="ml-2 block text-sm font-medium text-gray-900">
                Count as Emergency Fund
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">This investment will be included in your emergency fund calculation on the Financial Metrics page.</p>
          </div>

          {/* SIP Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="is_sip"
                id="is_sip"
                checked={formData.is_sip}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_sip" className="ml-2 block text-sm font-medium text-gray-900">
                This is a Systematic Investment Plan (SIP)
              </label>
            </div>

            {formData.is_sip && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">SIP Details</h4>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="SIP Amount"
                    type="number"
                    name="sip_amount"
                    value={formData.sip_amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required={formData.is_sip}
                  />

                  <Select
                    label="Frequency"
                    name="sip_frequency"
                    value={formData.sip_frequency}
                    onChange={handleInputChange}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'yearly', label: 'Yearly' },
                    ]}
                    required={formData.is_sip}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    name="sip_start_date"
                    value={formData.sip_start_date}
                    onChange={handleInputChange}
                    required={formData.is_sip}
                  />

                  <Input
                    label="End Date (Optional)"
                    type="date"
                    name="sip_end_date"
                    value={formData.sip_end_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Day of Month (1-28)"
                    type="number"
                    name="sip_day_of_month"
                    value={formData.sip_day_of_month}
                    onChange={handleInputChange}
                    placeholder="1"
                    min="1"
                    max="28"
                    required={formData.is_sip && formData.sip_frequency === 'monthly'}
                  />

                  <Input
                    label="Total Installments (Optional)"
                    type="number"
                    name="sip_total_installments"
                    value={formData.sip_total_installments}
                    onChange={handleInputChange}
                    placeholder="Leave empty for infinite"
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={createInvestment.isPending}>
              Save Investment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/investments')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
