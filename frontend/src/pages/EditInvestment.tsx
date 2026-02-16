import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccounts, useInvestmentTypes, useInvestment, useUpdateInvestment, useDeleteInvestment, useProcessSipPayment } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';
import { formatCurrency } from '../utils/format';
import type { Investment } from '../types';

interface FormData {
  name: string;
  investment_type_id: string;
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
  is_emergency_fund: boolean;
}

export function EditInvestment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: typesData, isLoading: typesLoading } = useInvestmentTypes();
  const { data: investmentData, isLoading: investmentLoading } = useInvestment(id || '');
  const updateInvestment = useUpdateInvestment();
  const deleteInvestment = useDeleteInvestment();
  const processSipPaymentMutation = useProcessSipPayment();

  const accounts = accountsData?.accounts || [];
  const investmentTypes = typesData?.investment_types || [];
  const investment = investmentData?.investment as Investment | undefined;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    investment_type_id: '',
    amount: '',
    units: '',
    purchase_price: '',
    purchase_date: '',
    description: '',
    is_sip: false,
    sip_amount: '',
    sip_frequency: 'monthly',
    sip_start_date: '',
    sip_end_date: '',
    sip_day_of_month: '1',
    sip_total_installments: '',
    is_emergency_fund: false,
  });

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name || '',
        investment_type_id: investment.investment_type_id || '',
        amount: investment.amount?.toString() || '',
        units: investment.units || '',
        purchase_price: investment.purchase_price?.toString() || '',
        purchase_date: investment.purchase_date || '',
        description: investment.description || '',
        is_sip: investment.is_sip || false,
        sip_amount: investment.sip_amount?.toString() || '',
        sip_frequency: (investment.sip_frequency as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly',
        sip_start_date: investment.sip_start_date || '',
        sip_end_date: investment.sip_end_date || '',
        sip_day_of_month: investment.sip_day_of_month?.toString() || '1',
        sip_total_installments: investment.sip_total_installments?.toString() || '',
        is_emergency_fund: investment.is_emergency_fund || false,
      });
    }
  }, [investment]);

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

    if (!id) {
      setError('Investment ID is missing');
      return;
    }

    try {
      const params: any = {
        name: formData.name,
        investment_type_id: formData.investment_type_id,
        amount: Number(formData.amount),
        units: formData.units || undefined,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
        purchase_date: formData.purchase_date,
        description: formData.description || undefined,
        is_emergency_fund: formData.is_emergency_fund,
      };

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
      }

      await updateInvestment.mutateAsync({ id, data: params });
      navigate('/investments');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update investment');
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!window.confirm('Are you sure you want to delete this investment? The investment amount will be credited back to the source account.')) {
      return;
    }

    try {
      await deleteInvestment.mutateAsync(id);
      navigate('/investments');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete investment');
    }
  };

  const handleProcessSip = async () => {
    if (!id) return;

    try {
      await processSipPaymentMutation.mutateAsync({ id });
      setSuccess('SIP payment processed successfully!');
      setError('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to process SIP payment');
    }
  };

  const eligibleAccounts = accounts.filter((acc) =>
    ['checking', 'savings', 'cash'].includes(acc.type)
  );

  const accountOptions = eligibleAccounts.map((acc) => ({
    value: acc.id,
    label: `${acc.name} (${acc.type}) - Balance: ${Number(acc.balance).toFixed(2)} ${acc.currency}`,
  }));

  const typeOptions = investmentTypes.map((type) => ({
    value: type.id,
    label: type.name.charAt(0).toUpperCase() + type.name.replace('_', ' ').slice(1),
  }));

  if (accountsLoading || typesLoading || investmentLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!investment) {
    return <div className="text-gray-500">Investment not found</div>;
  }

  const isActive = investment.status === 'active';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Investment</h1>
        <p className="text-gray-500 mt-1">Update investment details</p>
      </div>

      {!isActive && (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            This investment is {investment.status} and cannot be edited.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Source Account:</span> {investment.account_name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span>{' '}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${investment.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : investment.status === 'withdrawn'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {investment.status}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Type:</span> {investment.investment_type_name}
            </p>
            {investment.is_sip && (
              <>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">SIP Amount:</span> {formatCurrency(Number(investment.sip_amount || 0))}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Installments Completed:</span> {investment.sip_installments_completed}
                  {investment.sip_total_installments && ` / ${investment.sip_total_installments}`}
                </p>
              </>
            )}
          </div>

          <Input
            label="Investment Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Apple Inc. Stock, Vanguard Mutual Fund"
            disabled={!isActive}
            required
          />

          <Select
            label="Investment Type"
            name="investment_type_id"
            value={formData.investment_type_id}
            onChange={handleInputChange}
            options={typeOptions}
            placeholder="Select investment type"
            disabled={!isActive}
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
              disabled={!isActive}
              required
            />

            <Input
              label="Purchase Date"
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleInputChange}
              disabled={!isActive}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Units (Optional)"
              name="units"
              value={formData.units}
              onChange={handleInputChange}
              placeholder="e.g., 10 shares"
              disabled={!isActive}
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
              disabled={!isActive}
            />
          </div>

          <Input
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Additional notes about this investment"
            disabled={!isActive}
          />

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
                disabled={!isActive}
              />
              <label htmlFor="is_emergency_fund" className="ml-2 block text-sm font-medium text-gray-900">
                Count as Emergency Fund
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">This investment will be included in your emergency fund calculation on the Financial Metrics page.</p>
          </div>

          {/* SIP Section */}
          {investment.is_sip && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-4">SIP Details</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="SIP Amount"
                  type="number"
                  name="sip_amount"
                  value={formData.sip_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  disabled={!isActive}
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
                  disabled={!isActive}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  name="sip_start_date"
                  value={formData.sip_start_date}
                  onChange={handleInputChange}
                  disabled={!isActive}
                />

                <Input
                  label="End Date (Optional)"
                  type="date"
                  name="sip_end_date"
                  value={formData.sip_end_date}
                  onChange={handleInputChange}
                  disabled={!isActive}
                />
              </div>

              {isActive && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleProcessSip}
                  isLoading={processSipPaymentMutation.isPending}
                  className="mt-4"
                >
                  Process SIP Payment Now
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={updateInvestment.isPending} disabled={!isActive}>
              Update Investment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/investments')}
            >
              Cancel
            </Button>
            {isActive && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                isLoading={deleteInvestment.isPending}
                className="ml-auto"
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
