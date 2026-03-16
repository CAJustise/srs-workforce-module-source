import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, ArrowUpDown } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  menu_type: string;
  show_price: boolean;
  show_description: boolean;
  active: boolean;
  ingredients: string[] | null;
  allergens: string[] | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: number | null;
  portion_size: string | null;
  serves: number | null;
  category_id: string | null;
  category: {
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  menu_type: string;
  display_order: number;
  parent_id: string | null;
  active: boolean;
}

const FoodItemsAdmin: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ingredients, setIngredients] = useState<string>('');
  const [allergens, setAllergens] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MenuItem;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setIngredients(editingItem.ingredients?.join('\n') || '');
      setAllergens(editingItem.allergens?.join('\n') || '');
    } else {
      setIngredients('');
      setAllergens('');
    }
  }, [editingItem]);

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            *,
            category:category_id (name)
          `)
          .eq('menu_type', 'food')
          .order('name'),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('menu_type', 'food')
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || null,
      image_url: formData.get('image_url') as string,
      menu_type: 'food',
      show_price: formData.get('show_price') === 'on',
      show_description: formData.get('show_description') === 'on',
      active: formData.get('active') === 'on',
      ingredients: ingredients.split('\n').filter(i => i.trim()).map(i => i.trim()),
      allergens: allergens.split('\n').filter(a => a.trim()).map(a => a.trim()),
      is_vegetarian: formData.get('is_vegetarian') === 'on',
      is_vegan: formData.get('is_vegan') === 'on',
      is_gluten_free: formData.get('is_gluten_free') === 'on',
      spice_level: parseInt(formData.get('spice_level') as string) || null,
      portion_size: formData.get('portion_size') as string || null,
      serves: parseInt(formData.get('serves') as string) || null,
      category_id: formData.get('category_id') as string || null
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
      setIsFormOpen(false);
      setEditingItem(null);
      form.reset();
      setIngredients('');
      setAllergens('');
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

  const handleSort = (key: keyof MenuItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    
    const sortedItems = [...items].sort((a, b) => {
      if (a[key] === null) return 1;
      if (b[key] === null) return -1;
      
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setItems(sortedItems);
  };

  const getSortIcon = (key: keyof MenuItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${sortConfig.direction === 'asc' ? 'text-ocean-600' : 'text-ocean-600 rotate-180'}`} 
      />
    );
  };

  const sortedCategoryOptions = (() => {
    const sortByOrder = (a: Category, b: Category) =>
      a.display_order - b.display_order || a.name.localeCompare(b.name);
    const groups = new Map<string | null, Category[]>();

    categories.forEach((category) => {
      const key = category.parent_id ?? null;
      const existing = groups.get(key) || [];
      existing.push(category);
      groups.set(key, existing);
    });

    const flatten = (parentId: string): Category[] => {
      const children = [...(groups.get(parentId) || [])].sort(sortByOrder);
      return children.flatMap((child) => [child, ...flatten(child.id)]);
    };

    const cuisineRoot =
      categories.find((category) => category.id === 'cat_cuisine') ||
      categories.find((category) => category.name.toLowerCase() === 'cuisine') ||
      null;

    if (cuisineRoot) {
      return flatten(cuisineRoot.id).map((category) => {
        let depth = 0;
        let currentParentId = category.parent_id;
        while (currentParentId && currentParentId !== cuisineRoot.id) {
          const parent = categories.find((entry) => entry.id === currentParentId);
          if (!parent) break;
          depth += 1;
          currentParentId = parent.parent_id;
        }

        return {
          id: category.id,
          label: `${depth > 0 ? `${'— '.repeat(depth)} ` : ''}${category.name}`,
        };
      });
    }

    return categories
      .filter((category) => category.parent_id)
      .sort(sortByOrder)
      .map((category) => ({ id: category.id, label: category.name }));
  })();

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
            <h1 className="text-3xl font-display font-bold text-gray-900">Food Items</h1>
            <p className="text-gray-600 mt-2">Manage food menu items and their details.</p>
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
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
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
                    Category
                  </label>
                  <select
                    name="category_id"
                    defaultValue={editingItem?.category_id || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">No Category</option>
                    {sortedCategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
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

              <div className="grid md:grid-cols-2 gap-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spice Level
                  </label>
                  <select
                    name="spice_level"
                    defaultValue={editingItem?.spice_level || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">None</option>
                    <option value="0">0 - Not Spicy</option>
                    <option value="1">1 - Mild</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - Hot</option>
                    <option value="4">4 - Very Hot</option>
                    <option value="5">5 - Extreme</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portion Size
                  </label>
                  <input
                    type="text"
                    name="portion_size"
                    defaultValue={editingItem?.portion_size || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 8 oz, Large Bowl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serves
                  </label>
                  <input
                    type="number"
                    name="serves"
                    min="1"
                    defaultValue={editingItem?.serves || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Number of people"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  name="image_url"
                  defaultValue={editingItem?.image_url}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredients (one per line)
                </label>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Rice
Vegetables
Soy sauce"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergens (one per line)
                </label>
                <textarea
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Dairy
Nuts
Shellfish"
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

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_vegetarian"
                    defaultChecked={editingItem?.is_vegetarian ?? false}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Vegetarian</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_vegan"
                    defaultChecked={editingItem?.is_vegan ?? false}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_gluten_free"
                    defaultChecked={editingItem?.is_gluten_free ?? false}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Gluten Free</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingItem(null);
                  setIngredients('');
                  setAllergens('');
                }}
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
        )}

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('category_id')}
                >
                  <div className="flex items-center gap-2">
                    Category
                    {getSortIcon('category_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2">
                    Price
                    {getSortIcon('price')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className={!item.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="flex gap-2 mt-1">
                      {item.is_vegetarian && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Vegetarian
                        </span>
                      )}
                      {item.is_vegan && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Vegan
                        </span>
                      )}
                      {item.is_gluten_free && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Gluten Free
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.price ? `$${item.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
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
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No food items found. Click "Add Item" to create one.
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

export default FoodItemsAdmin;
