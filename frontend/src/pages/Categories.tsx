import { useState } from 'react';
import {
  useCategories,
  useTags,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from '../hooks';
import { Button, Card, CardContent, Input, Select, Alert, AlertDescription } from '../components/ui';
import { formatDate } from '../utils/format';

export function Categories() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    description: '',
  });

  const [tagForm, setTagForm] = useState({
    name: '',
    color: '#3B82F6',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: tagsData, isLoading: tagsLoading } = useTags();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const categories = categoriesData?.categories || [];
  const tags = tagsData?.tags || [];

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

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingTag) {
        await updateTag.mutateAsync({
          id: editingTag,
          params: { name: tagForm.name, color: tagForm.color },
        });
        setSuccessMessage('Tag updated successfully');
      } else {
        await createTag.mutateAsync(tagForm);
        setSuccessMessage('Tag created successfully');
      }
      setShowAddTag(false);
      setEditingTag(null);
      setTagForm({ name: '', color: '#3B82F6' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to save tag');
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

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      await deleteTag.mutateAsync(id);
      setSuccessMessage('Tag deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to delete tag');
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

  const handleEditTag = (tag: typeof tags[0]) => {
    setTagForm({
      name: tag.name,
      color: tag.color || '#3B82F6',
    });
    setEditingTag(tag.id);
    setShowAddTag(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Categories & Tags</h1>
          <p className="text-gray-500 mt-1">Manage your categories and tags</p>
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
            onClick={() => setActiveTab('tags')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tags'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tags
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

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddTag(true)}>Add Tag</Button>
          </div>

          {showAddTag && (
            <Card>
              <CardContent>
                <h3 className="text-lg font-medium mb-4">
                  {editingTag ? 'Edit Tag' : 'Add New Tag'}
                </h3>
                <form onSubmit={handleTagSubmit} className="space-y-4">
                  <Input
                    label="Name"
                    value={tagForm.name}
                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                    placeholder="Tag name"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        className="h-10 w-20 rounded border border-gray-300"
                      />
                      <Input
                        value={tagForm.color}
                        onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" isLoading={createTag.isPending || updateTag.isPending}>
                      {editingTag ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddTag(false);
                        setEditingTag(null);
                        setTagForm({ name: '', color: '#3B82F6' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {tagsLoading ? (
            <div className="text-gray-500">Loading tags...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {tags.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                          <th className="px-4 py-3 font-medium">Color</th>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Created</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tags.map((tag) => (
                          <tr key={tag.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: tag.color || '#3B82F6' }}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{tag.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(tag.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditTag(tag)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  disabled={deleteTag.isPending}
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
                    <p className="text-gray-500 mb-4">No tags found</p>
                    <Button onClick={() => setShowAddTag(true)}>Add your first tag</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
