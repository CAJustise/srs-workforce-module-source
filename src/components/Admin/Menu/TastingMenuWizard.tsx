import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

interface WizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialData?: InitialMenuData;
}

type MenuType = 'fixed' | 'prix_fixe';

interface MenuItem {
  name: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
}

interface Course {
  name: string;
  description: string;
  allows_choice: boolean;
  items: MenuItem[];
}

interface InitialCourse {
  name?: string | null;
  description?: string | null;
  allows_choice?: boolean | null;
  items?: Array<Partial<MenuItem>>;
}

interface InitialMenuData {
  id?: string;
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  menu_type?: MenuType | null;
  display_order?: number | null;
  active?: boolean | null;
  courses?: InitialCourse[];
}

interface FormDataState {
  menu: {
    name: string;
    description: string;
    price: string;
    menu_type: MenuType;
    display_order: number;
    active: boolean;
  };
  courses: Course[];
}

const createEmptyItem = (): MenuItem => ({
  name: '',
  description: '',
  ingredients: [],
  allergens: [],
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
});

const normalizeCourse = (course?: InitialCourse): Course => ({
  name: String(course?.name || ''),
  description: String(course?.description || ''),
  allows_choice: Boolean(course?.allows_choice),
  items: Array.isArray(course?.items)
    ? course.items.map((item) => ({
        ...createEmptyItem(),
        ...item,
        name: String(item?.name || ''),
        description: String(item?.description || ''),
        ingredients: Array.isArray(item?.ingredients)
          ? item.ingredients.filter((entry): entry is string => Boolean(entry))
          : [],
        allergens: Array.isArray(item?.allergens)
          ? item.allergens.filter((entry): entry is string => Boolean(entry))
          : [],
        is_vegetarian: Boolean(item?.is_vegetarian),
        is_vegan: Boolean(item?.is_vegan),
        is_gluten_free: Boolean(item?.is_gluten_free),
      }))
    : [],
});

const TastingMenuWizard: React.FC<WizardProps> = ({ onComplete, onCancel, initialData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormDataState>({
    menu: {
      name: String(initialData?.name || ''),
      description: String(initialData?.description || ''),
      price: initialData?.price != null ? String(initialData.price) : '',
      menu_type: initialData?.menu_type || 'fixed',
      display_order: Number(initialData?.display_order || 0),
      active: initialData?.active ?? true
    },
    courses:
      initialData?.courses?.length
        ? initialData.courses.map((course) => normalizeCourse(course))
        : [normalizeCourse()],
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create or update menu
      const menuData = {
        name: formData.menu.name,
        description: formData.menu.description,
        price: parseFloat(formData.menu.price),
        menu_type: formData.menu.menu_type,
        display_order: parseInt(formData.menu.display_order.toString()),
        active: formData.menu.active
      };

      let menuId = initialData?.id;

      if (initialData) {
        const { error } = await supabase
          .from('tasting_menus')
          .update(menuData)
          .eq('id', menuId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('tasting_menus')
          .insert([menuData])
          .select()
          .single();
        if (error) throw error;
        menuId = data.id;
      }

      // Handle courses and items
      if (initialData) {
        // Delete existing courses (cascade will delete items)
        await supabase
          .from('tasting_menu_courses')
          .delete()
          .eq('menu_id', menuId);
      }

      // Insert new courses and their items
      for (const [courseIndex, course] of formData.courses.entries()) {
        // Insert course
        const { data: courseData, error: courseError } = await supabase
          .from('tasting_menu_courses')
          .insert([{
            menu_id: menuId,
            name: course.name,
            description: course.description,
            display_order: courseIndex,
            allows_choice: course.allows_choice
          }])
          .select()
          .single();

        if (courseError) throw courseError;

        // Insert items for this course
        if (course.items.length > 0) {
          const itemsData = course.items.map((item, itemIndex) => ({
            course_id: courseData.id,
            name: item.name,
            description: item.description,
            ingredients: item.ingredients,
            allergens: item.allergens,
            is_vegetarian: item.is_vegetarian,
            is_vegan: item.is_vegan,
            is_gluten_free: item.is_gluten_free,
            display_order: itemIndex,
            active: true
          }));

          const { error: itemsError } = await supabase
            .from('tasting_menu_items')
            .insert(itemsData);

          if (itemsError) throw itemsError;
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('Error saving menu: ' + (error as Error).message);
    }
  };

  const addCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [
        ...prev.courses,
        { name: '', description: '', allows_choice: false, items: [] }
      ]
    }));
  };

  const removeCourse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  const updateCourse = <K extends keyof Course>(index: number, field: K, value: Course[K]) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === index ? { ...course, [field]: value } : course
      )
    }));
  };

  const addItem = (courseIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === courseIndex ? {
          ...course,
          items: [
            ...course.items,
            createEmptyItem()
          ]
        } : course
      )
    }));
  };

  const removeItem = (courseIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === courseIndex ? {
          ...course,
          items: course.items.filter((_, j) => j !== itemIndex)
        } : course
      )
    }));
  };

  const updateItem = <K extends keyof MenuItem>(
    courseIndex: number,
    itemIndex: number,
    field: K,
    value: MenuItem[K],
  ) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === courseIndex ? {
          ...course,
          items: course.items.map((item, j) => 
            j === itemIndex ? { ...item, [field]: value } : item
          )
        } : course
      )
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-gray-900">
            {initialData ? 'Edit' : 'Create'} Tasting Menu
          </h2>
          <div className="text-sm text-gray-500">
            Step {step} of 2
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-ocean-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menu Name
            </label>
            <input
              type="text"
              value={formData.menu.name}
              onChange={e => setFormData(prev => ({
                ...prev,
                menu: { ...prev.menu, name: e.target.value }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.menu.description}
              onChange={e => setFormData(prev => ({
                ...prev,
                menu: { ...prev.menu, description: e.target.value }
              }))}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.menu.price}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  menu: { ...prev.menu, price: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.menu.display_order}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  menu: { ...prev.menu, display_order: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menu Type
              </label>
              <select
                value={formData.menu.menu_type}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  menu: { ...prev.menu, menu_type: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="fixed">Fixed Menu</option>
                <option value="prix_fixe">Prix Fixe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.menu.active}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  menu: { ...prev.menu, active: e.target.checked }
                }))}
                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {formData.courses.map((course, courseIndex) => (
            <div key={courseIndex} className="bg-gray-50 p-6 rounded-lg relative">
              {formData.courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCourse(courseIndex)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                >
                  Remove Course
                </button>
              )}
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Name
                    </label>
                    <input
                      type="text"
                      value={course.name}
                      onChange={e => updateCourse(courseIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={course.description}
                      onChange={e => updateCourse(courseIndex, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={course.allows_choice}
                      onChange={e => updateCourse(courseIndex, 'allows_choice', e.target.checked)}
                      className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                    />
                    <span className="text-sm text-gray-700">Allows Choice</span>
                  </label>
                </div>

                {/* Course Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">Items</h4>
                    <button
                      type="button"
                      onClick={() => addItem(courseIndex)}
                      className="text-ocean-600 hover:text-ocean-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-6">
                    {course.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-white p-4 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => removeItem(courseIndex, itemIndex)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Item Name
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateItem(courseIndex, itemIndex, 'name', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={item.description}
                              onChange={e => updateItem(courseIndex, itemIndex, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ingredients (one per line)
                            </label>
                            <textarea
                              value={item.ingredients.join('\n')}
                              onChange={e => updateItem(courseIndex, itemIndex, 'ingredients', e.target.value.split('\n').filter(i => i.trim()))}
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Allergens (one per line)
                            </label>
                            <textarea
                              value={item.allergens.join('\n')}
                              onChange={e => updateItem(courseIndex, itemIndex, 'allergens', e.target.value.split('\n').filter(a => a.trim()))}
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                            />
                          </div>

                          <div className="flex gap-6">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.is_vegetarian}
                                onChange={e => updateItem(courseIndex, itemIndex, 'is_vegetarian', e.target.checked)}
                                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                              />
                              <span className="text-sm text-gray-700">Vegetarian</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.is_vegan}
                                onChange={e => updateItem(courseIndex, itemIndex, 'is_vegan', e.target.checked)}
                                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                              />
                              <span className="text-sm text-gray-700">Vegan</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.is_gluten_free}
                                onChange={e => updateItem(courseIndex, itemIndex, 'is_gluten_free', e.target.checked)}
                                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                              />
                              <span className="text-sm text-gray-700">Gluten Free</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addCourse}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-ocean-600 hover:text-ocean-600 transition-colors"
          >
            Add Course
          </button>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={step === 1 ? onCancel : handleBack}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <button
          onClick={step === 1 ? handleNext : handleMenuSubmit}
          className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 flex items-center gap-2"
        >
          {step === 1 ? (
            <>
              Next
              <ChevronRight className="h-5 w-5" />
            </>
          ) : (
            'Save Menu'
          )}
        </button>
      </div>
    </div>
  );
};

export default TastingMenuWizard;
