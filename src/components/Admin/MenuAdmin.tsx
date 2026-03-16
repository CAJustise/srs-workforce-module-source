import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { StrengthIndicator } from '../Menu/StrengthIndicator';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCategory } from './SortableCategory';
import ImageUpload from './ImageUpload';

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
  alcohol_content: number | null;
  garnish: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  menu_type: string;
  display_order: number;
  active: boolean;
}

const MenuAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [ingredients, setIngredients] = useState<string>('');
  const [allergens, setAllergens] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MenuItem;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Please sign in to access the admin panel');
      navigate('/');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (editingItem) {
      setIngredients(editingItem.ingredients?.join('\n') || '');
      setAllergens(editingItem.allergens?.join('\n') || '');
    } else {
      setIngredients('');
      setAllergens('');
    }
  }, [editingItem]);

  const fetchData = useCallback(async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .order('name'),
        supabase
          .from('menu_categories')
          .select('*')
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
  }, []);

  useEffect(() => {
    void checkAuth();
    void fetchData();
  }, [checkAuth, fetchData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex(cat => cat.id === active.id);
    const newIndex = categories.findIndex(cat => cat.id === over.id);
    
    const newCategories = arrayMove(categories, oldIndex, newIndex);
    
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      display_order: index
    }));

    setCategories(updatedCategories);

    try {
      const { error } = await supabase
        .from('menu_categories')
        .upsert(
          updatedCategories.map(({ id, display_order }) => ({
            id,
            display_order
          }))
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating category order:', error);
      alert('Error updating category order: ' + (error as Error).message);
      fetchData();
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

  const handleItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || null,
      image_url: formData.get('image_url') as string,
      menu_type: formData.get('menu_type') as string,
      show_price: formData.get('show_price') === 'on',
      show_description: formData.get('show_description') === 'on',
      active: formData.get('active') === 'on',
      ingredients: ingredients.split('\n').filter(i => i.trim()).map(i => i.trim()),
      allergens: allergens.split('\n').filter(a => a.trim()).map(a => a.trim()),
      alcohol_content: formData.get('menu_type') === 'drinks' 
        ? parseInt(formData.get('alcohol_content') as string) || null 
        : null,
      garnish: formData.get('garnish') as string || null,
      category_id: formData.get('category_id') as string || null,
      is_vegetarian: formData.get('is_vegetarian') === 'on',
      is_vegan: formData.get('is_vegan') === 'on',
      is_gluten_free: formData.get('is_gluten_free') === 'on',
      spice_level: parseInt(formData.get('spice_level') as string) || null,
      portion_size: formData.get('portion_size') as string || null,
      serves: parseInt(formData.get('serves') as string) || null
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
      setIsItemFormOpen(false);
      setEditingItem(null);
      form.reset();
      setIngredients('');
      setAllergens('');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + (error as Error).message);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const categoryData = {
      name: formData.get('name') as string,
      menu_type: formData.get('menu_type') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      active: formData.get('active') === 'on',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be signed in to perform this action');
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert([categoryData]);
        if (error) throw error;
      }

      await fetchData();
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      form.reset();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + (error as Error).message);
    }
  };

  const handleDeleteItem = async (id: string) => {
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + (error as Error).message);
    }
  };

  const renderMenuItems = () => (
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
              onClick={() => handleSort('menu_type')}
            >
              <div className="flex items-center gap-2">
                Type
                {getSortIcon('menu_type')}
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
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className={!item.active ? 'bg-gray-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{item.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {categories.find(c => c.id === item.category_id)?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{item.menu_type}</span>
                  {item.menu_type === 'drinks' && Number(item.alcohol_content) > 0 && (
                    <StrengthIndicator strength={Number(item.alcohol_content)} className="h-4 w-4" />
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.price ? `$${item.price.toFixed(2)}` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setIsItemFormOpen(true);
                  }}
                  className="text-ocean-600 hover:text-ocean-700 mr-4"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold">Menu Categories</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryFormOpen(true);
              }}
              className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
            >
              <Plus className="h-5 w-5" />
              Add Category
            </button>
          </div>

          {isCategoryFormOpen && (
            <form onSubmit={handleCategorySubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingCategory?.name}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Type
                  </label>
                  <select
                    name="menu_type"
                    required
                    defaultValue={editingCategory?.menu_type || 'food'}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="food">Food</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingCategory?.display_order || 0}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={editingCategory?.active ?? true}
                      className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryFormOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
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
                  <tr>
                    <td colSpan={5} className="p-0">
                      <SortableContext
                        items={categories.map(cat => cat.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <table className="min-w-full">
                          <tbody>
                            {categories.map((category) => (
                              <SortableCategory
                                key={category.id}
                                category={category}
                                onEdit={(category) => {
                                  setEditingCategory(category);
                                  setIsCategoryFormOpen(true);
                                }}
                                onDelete={handleDeleteCategory}
                              />
                            ))}
                          </tbody>
                        </table>
                      </SortableContext>
                    </td>
                  </tr>
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Menu Items</h1>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsItemFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>

        {isItemFormOpen && (
          <form onSubmit={handleItemSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="md:col-span-2">
                <ImageUpload
                  onImageSelect={(url) => {
                    const imageUrlInput = document.querySelector('input[name="image_url"]') as HTMLInputElement;
                    if (imageUrlInput) {
                      imageUrlInput.value = url;
                    }
                  }}
                  currentImageUrl={editingItem?.image_url}
                />
              </div>

              <div className="hidden">
                <input
                  type="text"
                  name="image_url"
                  defaultValue={editingItem?.image_url}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Menu Type
                </label>
                <select
                  name="menu_type"
                  required
                  defaultValue={editingItem?.menu_type || 'food'}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="food">Food</option>
                  <option value="drinks">Drinks</option>
                </select>
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
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garnish
                </label>
                <input
                  type="text"
                  name="garnish"
                  defaultValue={editingItem?.garnish || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Mint sprig and lime wheel"
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
                  Spice Level (0-5)
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
                  setIsItemFormOpen(false);
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

        {renderMenuItems()}
      </div>
    </div>
  );
};

export default MenuAdmin;
