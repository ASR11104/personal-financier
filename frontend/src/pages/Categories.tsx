import { useState } from 'react';
import {
  useCategories,
  useSubCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubCategory,
  useUpdateSubCategory,
  useDeleteSubCategory,
} from '../hooks';
import { Button, Card, CardContent, Input, Select, Alert, AlertDescription } from '../components/ui';
import { formatDate } from '../utils/format';

export function Categories() {
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    description: '',
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    category_id: '',
    name: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: subCategoriesData, isLoading: subCategoriesLoading } = useSubCategories(
    selectedCategory ? { category_id: selectedCategory } : undefined
  );

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubCategory = useCreateSubCategory();
  const updateSubCategory = useUpdateSubCategory();
  const deleteSubCategory = useDeleteSubCategory();

  const categories = categoriesData?.categories || [];
  const subCategories = subCategoriesData?.sub_categories || [];

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory,
          params: { name: categoryForm.name, description: categoryForm.description },
        });
        setSuccessMessage('Category updated successfully');
      } else {
        await createCategory.mutateAsync(categoryForm);
        setSuccessMessage('Category created successfully');
      }
      setShowAddCategory(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', type: 'expense', description: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to save category');
    }
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubCategory) {
        await updateSubCategory.mutateAsync({
          id: editingSubCategory,
          params: { name: subCategoryForm.name, description: subCategoryForm.description },
        });
        setSuccessMessage('SubCategory updated successfully');
      } else {
        await createSubCategory.mutateAsync(subCategoryForm);
        setSuccessMessage('SubCategory created successfully');
      }
      setShowAddSubCategory(false);
      setEditingSubCategory(null);
      setSubCategoryForm({ category_id: '', name: '', description: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to save subcategory');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory.mutateAsync(id);
      setSuccessMessage('Category deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      await deleteSubCategory.mutateAsync(id);
      setSuccessMessage('SubCategory deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  const handleEditCategory = (category: typeof categories[0]) => {
    setCategoryForm({
      name: category.name,
      type: category.type,
      description: category.description || '',
    });
    setEditingCategory(category.id);
    setShowAddCategory(true);
  };

  const handleEditSubCategory = (subCategory: typeof subCategories[0]) => {
    setSubCategoryForm({
      category_id: subCategory.category_id,
      name: subCategory.name,
      description: subCategory.description || '',
    });
    setEditingSubCategory(subCategory.id);
    setShowAddSubCategory(true);
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  if (categoriesLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage your categories and subcategories</p>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subcategories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            SubCategories
          </button>
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddCategory(true)}>Add Category</Button>
          </div>

          {showAddCategory && (
            <Card>
              <CardContent>
                <h3 className="text-lg font-medium mb-4">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <Input
                    label="Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Category name"
                    required
                  />
                  <Select
                    label="Type"
                    value={categoryForm.type}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        type: e.target.value as 'income' | 'expense' | 'transfer',
                      })
                    }
                    options={[
                      { value: 'expense', label: 'Expense' },
                      { value: 'income', label: 'Income' },
                      { value: 'transfer', label: 'Transfer' },
                    ]}
                  />
                  <Input
                    label="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={createCategory.isPending || updateCategory.isPending}>
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddCategory(false);
                        setEditingCategory(null);
                        setCategoryForm({ name: '', type: 'expense', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {categories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{category.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                category.type === 'expense'
                                  ? 'bg-red-100 text-red-800'
                                  : category.type === 'income'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {category.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {category.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(category.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                disabled={deleteCategory.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No categories found</p>
                  <Button onClick={() => setShowAddCategory(true)}>Add your first category</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SubCategories Tab */}
      {activeTab === 'subcategories' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-4">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
              placeholder="Filter by category"
              className="w-48"
            />
            <Button onClick={() => setShowAddSubCategory(true)}>Add SubCategory</Button>
          </div>

          {showAddSubCategory && (
            <Card>
              <CardContent>
                <h3 className="text-lg font-medium mb-4">
                  {editingSubCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
                </h3>
                <form onSubmit={handleSubCategorySubmit} className="space-y-4">
                  <Select
                    label="Category"
                    value={subCategoryForm.category_id}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, category_id: e.target.value })}
                    options={categoryOptions}
                    placeholder="Select a category"
                    required
                  />
                  <Input
                    label="Name"
                    value={subCategoryForm.name}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                    placeholder="SubCategory name"
                    required
                  />
                  <Input
                    label="Description"
                    value={subCategoryForm.description}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={createSubCategory.isPending || updateSubCategory.isPending}>
                      {editingSubCategory ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddSubCategory(false);
                        setEditingSubCategory(null);
                        setSubCategoryForm({ category_id: '', name: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {subCategories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategories.map((subCategory) => (
                        <tr key={subCategory.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{subCategory.name}</td>
                          <td className="px-4 py-3 text-sm">{subCategory.category_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {subCategory.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(subCategory.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditSubCategory(subCategory)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(subCategory.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                disabled={deleteSubCategory.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No subcategories found</p>
                  <Button onClick={() => setShowAddSubCategory(true)}>Add your first subcategory</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
