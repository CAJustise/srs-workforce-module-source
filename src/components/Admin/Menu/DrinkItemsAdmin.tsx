import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, ArrowUpDown, Search, Filter, X } from 'lucide-react';
import { StrengthIndicator } from '../../Menu/StrengthIndicator';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  bottle_price: number | null;
  image_url: string | null;
  menu_type: string;
  show_price: boolean;
  show_description: boolean;
  active: boolean;
  ingredients: string[] | null;
  alcohol_content: number | null;
  garnish: string | null;
  category_id: string | null;
  category: {
    name: string;
    parent_id: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  menu_type: string;
  display_order: number;
  active: boolean;
  parent_id: string | null;
}

interface SortConfig {
  key: keyof MenuItem | 'category' | 'subcategory';
  direction: 'asc' | 'desc';
}

const DrinkItemsAdmin: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ingredients, setIngredients] = useState<string>('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMainCategory, setFilterMainCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  // Get subcategories based on selected main category
  const subcategories = filterMainCategory
    ? categories.filter(cat => cat.parent_id === filterMainCategory)
    : categories.filter(cat => cat.parent_id !== null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...items];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.ingredients?.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Apply main category filter
    if (filterMainCategory) {
      result = result.filter(item => {
        // If the item's category is a subcategory, check its parent
        if (item.category?.parent_id) {
          return item.category.parent_id === filterMainCategory;
        }
        // If it's a main category, check directly
        return item.category_id === filterMainCategory;
      });
    }

    // Apply subcategory filter
    if (filterSubcategory) {
      result = result.filter(item => item.category_id === filterSubcategory);
    }

    // Apply active status filter
    if (filterActive !== null) {
      result = result.filter(item => item.active === filterActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortConfig.key === 'category' || sortConfig.key === 'subcategory') {
        const aParentCategory = a.category?.parent_id 
          ? categories.find(cat => cat.id === a.category?.parent_id)
          : null;
        const bParentCategory = b.category?.parent_id 
          ? categories.find(cat => cat.id === b.category?.parent_id)
          : null;

        if (sortConfig.key === 'category') {
          const aName = (aParentCategory || a.category)?.name || '';
          const bName = (bParentCategory || b.category)?.name || '';
          return sortConfig.direction === 'asc' 
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        } else {
          const aName = a.category?.parent_id ? a.category?.name || '' : '';
          const bName = b.category?.parent_id ? b.category?.name || '' : '';
          return sortConfig.direction === 'asc' 
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        }
      }

      const aVal = a[sortConfig.key] as string | number | null;
      const bVal = b[sortConfig.key] as string | number | null;

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc'
        ? (aVal < bVal ? -1 : 1)
        : (bVal < aVal ? -1 : 1);
    });

    setDisplayedItems(result);
  }, [items, searchQuery, filterMainCategory, filterSubcategory, filterActive, sortConfig, categories]);

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            *,
            category:category_id (
              name,
              parent_id
            )
          `)
          .eq('menu_type', 'drinks')
          .order('name'),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('menu_type', 'drinks')
          .eq('active', true)
          .order('display_order')
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMainCategory(e.target.value);
    // Clear subcategory when main category changes
    if (formRef.current) {
      const subcategorySelect = formRef.current.querySelector('select[name="category_id"]') as HTMLSelectElement;
      if (subcategorySelect) {
        subcategorySelect.value = '';
      }
    }
  };

  useEffect(() => {
    if (editingItem) {
      setIngredients(editingItem.ingredients?.join('\n') || '');
      if (editingItem.category?.parent_id) {
        setSelectedMainCategory(editingItem.category.parent_id);
      } else if (editingItem.category_id) {
        setSelectedMainCategory(editingItem.category_id);
      }
    } else {
      setIngredients('');
      setSelectedMainCategory('');
    }
  }, [editingItem]);

  useEffect(() => {
    if (!isFormOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFormOpen]);

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setIngredients('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const categoryId = formData.get('category_id') as string;
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    const isWine = selectedCategory?.name === 'Wine' || 
                  categories.find(cat => cat.id === selectedCategory?.parent_id)?.name === 'Wine';
    
    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || null,
      bottle_price: isWine ? (parseFloat(formData.get('bottle_price') as string) || null) : null,
      image_url: formData.get('image_url') as string,
      menu_type: 'drinks',
      show_price: formData.get('show_price') === 'on',
      show_description: formData.get('show_description') === 'on',
      active: formData.get('active') === 'on',
      ingredients: ingredients.split('\n').filter(i => i.trim()).map(i => i.trim()),
      alcohol_content: parseInt(formData.get('alcohol_content') as string) || null,
      garnish: formData.get('garnish') as string || null,
      category_id: categoryId || null
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);
        if (error) throw error;
      }

      await fetchData();
      closeFormModal();
      form.reset();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + (error as Error).message);
    }
  };

  const handleSort = (key: keyof MenuItem | 'category' | 'subcategory') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterMainCategory('');
    setFilterSubcategory('');
    setFilterActive(null);
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Drink Items</h1>
            <p className="text-gray-600 mt-2">Manage drink menu items and their details.</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>

        {isFormOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 p-4 md:p-8 overflow-y-auto"
            onClick={closeFormModal}
          >
            <div
              className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-lg">
                <h2 className="text-xl font-display font-bold text-gray-900">
                  {editingItem ? 'Edit Drink Item' : 'Add Drink Item'}
                </h2>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="p-6"
              >
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={editingItem?.name}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Main Category
                      </label>
                      <select
                        value={selectedMainCategory}
                        onChange={handleMainCategoryChange}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select Main Category</option>
                        {mainCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMainCategory && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subcategory
                        </label>
                        <select
                          name="category_id"
                          required
                          defaultValue={editingItem?.category_id || ''}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Select Subcategory</option>
                          {getSubcategories(selectedMainCategory).map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedMainCategory && mainCategories.find(cat => cat.id === selectedMainCategory)?.name === 'Wine' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Glass Price
                          </label>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            defaultValue={editingItem?.price || ''}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bottle Price
                          </label>
                          <input
                            type="number"
                            name="bottle_price"
                            step="0.01"
                            defaultValue={editingItem?.bottle_price || ''}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          defaultValue={editingItem?.price || ''}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editingItem?.description || ''}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alcohol Content (1-5)
                    </label>
                    <select
                      name="alcohol_content"
                      defaultValue={editingItem?.alcohol_content || ''}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">None</option>
                      <option value="1">1 - Light</option>
                      <option value="2">2 - Mild</option>
                      <option value="3">3 - Medium</option>
                      <option value="4">4 - Strong</option>
                      <option value="5">5 - Very Strong</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Garnish
                    </label>
                    <input
                      type="text"
                      name="garnish"
                      defaultValue={editingItem?.garnish || ''}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Mint sprig and lime wheel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      name="image_url"
                      defaultValue={editingItem?.image_url || ''}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredients (one per line)
                    </label>
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="Rum
Fresh lime juice
Simple syrup
Mint leaves"
                    />
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="show_price"
                        defaultChecked={editingItem?.show_price ?? true}
                        className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="text-sm text-gray-700">Show Price</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="show_description"
                        defaultChecked={editingItem?.show_description ?? false}
                        className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="text-sm text-gray-700">Show Description</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={editingItem?.active ?? true}
                        className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                  >
                    {editingItem ? 'Update' : 'Create'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <select
                value={filterMainCategory}
                onChange={(e) => setFilterMainCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">All Main Categories</option>
                {mainCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">All Subcategories</option>
                {subcategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'name' ? 'text-ocean-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    Category
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'category' ? 'text-ocean-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    Price
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'price' ? 'text-ocean-600' : 'text-gray-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedItems.map((item) => (
                <tr key={item.id} className={!item.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {Number(item.alcohol_content) > 0 && (
                      <div className="mt-1">
                        <StrengthIndicator
                          strength={Number(item.alcohol_content)}
                          className="h-4 w-4"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.category?.name === 'Wine' ? (
                      <div className="flex flex-col">
                        <span>Glass: {item.price ? `$${item.price.toFixed(2)}` : '-'}</span>
                        <span>Bottle: {item.bottle_price ? `$${item.bottle_price.toFixed(2)}` : '-'}</span>
                      </div>
                    ) : (
                      item.price ? `$${item.price.toFixed(2)}` : '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsFormOpen(true);
                      }}
                      className="text-ocean-600 hover:text-ocean-700 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No items found. {searchQuery || filterMainCategory || filterSubcategory || filterActive !== null ? 'Try adjusting your filters.' : 'Click "Add Item" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DrinkItemsAdmin;
