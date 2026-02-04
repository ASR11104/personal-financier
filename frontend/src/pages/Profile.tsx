import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '../hooks';
import { Button, Card, Input, Select, Alert, AlertDescription } from '../components/ui';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: '', label: 'Select marital status' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' },
  { value: 'other', label: 'Other' },
];

export function Profile() {
  const navigate = useNavigate();
  const { data: profileData, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    default_currency: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    number_of_dependants: '',
    country: '',
    state: '',
    district: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name || '',
        last_name: profileData.user.last_name || '',
        default_currency: profileData.user.default_currency || 'USD',
        date_of_birth: profileData.user.date_of_birth || '',
        gender: profileData.user.gender || '',
        marital_status: profileData.user.marital_status || '',
        number_of_dependants: profileData.user.number_of_dependants?.toString() || '',
        country: profileData.user.country || '',
        state: profileData.user.state || '',
        district: profileData.user.district || '',
      });
    }
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      await updateProfile.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name || undefined,
        default_currency: formData.default_currency,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        marital_status: formData.marital_status || undefined,
        number_of_dependants: formData.number_of_dependants ? parseInt(formData.number_of_dependants) : undefined,
        country: formData.country || undefined,
        state: formData.state || undefined,
        district: formData.district || undefined,
      });
      setSuccessMessage('Profile updated successfully');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!profileData?.user) {
    return <div className="text-gray-500">User not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your profile settings</p>
      </div>

      <Card className="mb-6">
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-500">Email (cannot be changed)</p>
          <p className="font-medium text-gray-900">{profileData.user.email}</p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="border-b pb-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
            />

            <Input
              label="Last Name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
            />

            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={GENDER_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Marital Status"
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              options={MARITAL_STATUS_OPTIONS}
            />

            <Input
              label="Number of Dependants"
              type="number"
              name="number_of_dependants"
              value={formData.number_of_dependants}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Location Information */}
          <div className="border-b pb-2 mb-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              options={COUNTRY_OPTIONS}
            />

            <Input
              label="State"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="California"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="District"
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Los Angeles"
            />
          </div>

          {/* Account Settings */}
          <div className="border-b pb-2 mb-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
          </div>

          <Select
            label="Currency"
            name="default_currency"
            value={formData.default_currency}
            onChange={handleChange}
            options={CURRENCY_OPTIONS}
            placeholder="Select your currency"
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={updateProfile.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
