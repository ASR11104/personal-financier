import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  useInvestments, 
  useAccounts, 
  useInvestmentTypes,
  useWithdrawInvestment,
  useProfile 
} from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription, LoadingSpinner } from '../components/ui';
import { formatCurrency } from '../utils/format';
import type { Investment } from '../types';

export function Investments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);
  const [withdrawData, setWithdrawData] = useState({
    target_account_id: '',
    withdrawal_amount: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: investmentsData, isLoading: investmentsLoading, refetch } = useInvestments({
    status: searchParams.get('status') as 'active' | 'sold' | 'withdrawn' | undefined,
    investment_type_id: searchParams.get('type') || undefined,
    account_id: searchParams.get('account') || undefined,
    is_sip: searchParams.get('is_sip') === 'true' ? true : searchParams.get('is_sip') === 'false' ? false : undefined,
  });

  const { data: accountsData } = useAccounts();
  const { data: typesData } = useInvestmentTypes();
  const { data: profileData } = useProfile();
  const withdrawMutation = useWithdrawInvestment();

  const investments = investmentsData?.investments || [];
  const accounts = accountsData?.accounts || [];
  const investmentTypes = typesData?.investment_types || [];
  const userCurrency = profileData?.user.default_currency || 'USD';

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleWithdraw = async () => {
    if (!selectedInvestment) return;

    try {
      await withdrawMutation.mutateAsync({
        id: selectedInvestment,
        data: {
          target_account_id: withdrawData.target_account_id,
          withdrawal_amount: withdrawData.withdrawal_amount ? Number(withdrawData.withdrawal_amount) : undefined,
          withdrawal_date: withdrawData.withdrawal_date,
          description: withdrawData.description || undefined,
        },
      });
      setSuccess('Investment withdrawn successfully! An income record has been created.');
      setWithdrawModalOpen(false);
      setSelectedInvestment(null);
      refetch();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to withdraw investment');
    }
  };

  const openWithdrawModal = (investmentId: string) => {
    setSelectedInvestment(investmentId);
    setWithdrawModalOpen(true);
    setError('');
    setSuccess('');
  };

  const accountOptions = accounts
    .filter((acc) => ['checking', 'savings', 'cash'].includes(acc.type))
    .map((acc) => ({
      value: acc.id,
      label: `${acc.name} (${acc.type})`,
    }));

  const typeOptions = investmentTypes.map((type) => ({
    value: type.id,
    label: type.name.charAt(0).toUpperCase() + type.name.replace('_', ' ').slice(1),
  }));

  // Calculate totals - use current_amount for accurate tracking of partial withdrawals
  const activeInvestments = investments.filter((inv) => inv.status === 'active');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.current_amount ?? inv.amount), 0);
  const sipInvestments = activeInvestments.filter((inv) => inv.is_sip);

  if (investmentsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-500 mt-1">Track your investment portfolio</p>
        </div>
        <Link to="/investments/add">
          <Button>Add Investment</Button>
        </Link>
      </div>

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested, userCurrency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active Investments</p>
          <p className="text-2xl font-bold text-green-600">{activeInvestments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">SIP Investments</p>
          <p className="text-2xl font-bold text-purple-600">{sipInvestments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total SIP Amount</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              sipInvestments.reduce((sum, inv) => sum + Number(inv.sip_amount || 0), 0),
              userCurrency
            )}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Status"
            name="status"
            value={searchParams.get('status') || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'withdrawn', label: 'Withdrawn' },
              { value: 'sold', label: 'Sold' },
            ]}
            placeholder="Filter by status"
          />
          <Select
            label="Type"
            name="type"
            value={searchParams.get('type') || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            options={[{ value: '', label: 'All Types' }, ...typeOptions]}
            placeholder="Filter by type"
          />
          <Select
            label="SIP"
            name="is_sip"
            value={searchParams.get('is_sip') || ''}
            onChange={(e) => handleFilterChange('is_sip', e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'SIP Only' },
              { value: 'false', label: 'Non-SIP Only' },
            ]}
            placeholder="Filter by SIP"
          />
          <Select
            label="Account"
            name="account"
            value={searchParams.get('account') || ''}
            onChange={(e) => handleFilterChange('account', e.target.value)}
            options={[{ value: '', label: 'All Accounts' }, ...accountOptions]}
            placeholder="Filter by account"
          />
        </div>
      </Card>

      {/* Investments List */}
      {investments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No investments found</p>
          <Link to="/investments/add">
            <Button>Add Your First Investment</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => (
            <Card key={investment.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        investment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : investment.status === 'withdrawn'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    />
                    {investment.is_sip && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        SIP
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {investment.investment_type_name} • {investment.account_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Purchased: {new Date(investment.purchase_date).toLocaleDateString()}
                    {investment.units && ` • ${investment.units}`}
                    {investment.purchase_price && ` • Price: ${formatCurrency(Number(investment.purchase_price), userCurrency)}`}
                  </p>
                  {investment.is_sip && (
                    <p className="text-sm text-purple-600 mt-1">
                      SIP: {formatCurrency(Number(investment.sip_amount || 0), userCurrency)}/month • 
                      Completed: {investment.sip_installments_completed}
                      {investment.sip_total_installments && ` / ${investment.sip_total_installments}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(Number(investment.current_amount ?? investment.amount), userCurrency)}
                    {investment.current_amount !== undefined && investment.current_amount < investment.amount && (
                      <span className="text-sm text-gray-400 ml-2 line-through">
                        {formatCurrency(Number(investment.amount), userCurrency)}
                      </span>
                    )}
                  </p>
                  {investment.description && (
                    <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">{investment.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/investments/${investment.id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
                {investment.status === 'active' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openWithdrawModal(investment.id)}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Withdraw Investment</h2>
            
            {error && (
              <Alert variant="error" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Select
                label="Target Account"
                name="target_account_id"
                value={withdrawData.target_account_id}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, target_account_id: e.target.value }))}
                options={accountOptions}
                placeholder="Select target account"
                required
              />

              <Input
                label="Withdrawal Amount (leave empty for full amount)"
                type="number"
                name="withdrawal_amount"
                value={withdrawData.withdrawal_amount}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, withdrawal_amount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0.01"
              />

              <Input
                label="Withdrawal Date"
                type="date"
                name="withdrawal_date"
                value={withdrawData.withdrawal_date}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, withdrawal_date: e.target.value }))}
                required
              />

              <Input
                label="Description (Optional)"
                name="description"
                value={withdrawData.description}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Notes about this withdrawal"
              />

              <p className="text-sm text-gray-500">
                Note: This will create an income record and add the amount to your target account.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleWithdraw}
                isLoading={withdrawMutation.isPending}
                disabled={!withdrawData.target_account_id}
              >
                Confirm Withdrawal
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setSelectedInvestment(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
