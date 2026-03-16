import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import TastingMenuWizard from './TastingMenuWizard';

interface TastingMenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string[] | null;
  allergens: string[] | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  display_order: number;
}

interface TastingMenuCourse {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  allows_choice: boolean;
  items: TastingMenuItem[];
}

interface TastingMenu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  menu_type: 'fixed' | 'prix_fixe';
  display_order: number;
  courses: TastingMenuCourse[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  menu_type: 'fixed' | 'prix_fixe';
  courses: {
    name: string;
    description: string | null;
    display_order: number;
    allows_choice: boolean;
  }[];
}

interface MenuCardProps {
  menu: TastingMenu;
  onEdit: (menu: TastingMenu) => void;
  onDelete: (id: string) => void;
  onSaveTemplate: (menu: TastingMenu) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ menu, onEdit, onDelete, onSaveTemplate }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-ocean-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-display font-bold">{menu.name}</h3>
            <div className="flex items-baseline gap-4 mt-1">
              <span className="text-xl font-garamond">${menu.price.toFixed(2)}</span>
              <span className="text-sm capitalize">{menu.menu_type}</span>
              <span className="text-sm text-white/75">Order: {menu.display_order}</span>
            </div>
            {menu.description && (
              <p className="mt-2 font-garamond text-white/90">{menu.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSaveTemplate(menu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Save as Template"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={() => onEdit(menu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(menu.id)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {menu.courses.map((course) => (
          <div key={course.id} className="space-y-4">
            <div className="flex items-baseline gap-4">
              <h4 className="text-xl font-display font-bold text-gray-900">
                {course.name}
              </h4>
              {course.allows_choice && (
                <span className="text-sm text-ocean-600 font-medium">
                  (Choice of One)
                </span>
              )}
            </div>

            {course.description && (
              <p className="text-gray-600 font-garamond">
                {course.description}
              </p>
            )}

            <div className="space-y-6">
              {course.items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <h5 className="text-lg font-garamond font-medium text-gray-900">
                    {item.name}
                  </h5>
                  {item.description && (
                    <p className="text-gray-600 font-garamond">
                      {item.description}
                    </p>
                  )}
                  {(item.ingredients?.length || item.allergens?.length) && (
                    <div className="space-y-1">
                      {item.ingredients?.length > 0 && (
                        <p className="text-sm text-gray-500 font-garamond">
                          {item.ingredients.join(' • ')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {item.is_vegetarian && !item.is_vegan && (
                          <span className="text-xs font-medium text-ocean-600">V</span>
                        )}
                        {item.is_vegan && (
                          <span className="text-xs font-medium text-ocean-600">VG</span>
                        )}
                        {item.is_gluten_free && (
                          <span className="text-xs font-medium text-ocean-600">GF</span>
                        )}
                        {item.allergens?.length > 0 && (
                          <span className="text-xs text-red-600 font-medium">
                            Contains: {item.allergens.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TastingMenusAdmin: React.FC = () => {
  const [tastingMenus, setTastingMenus] = useState<TastingMenu[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState<TastingMenu | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('tasting_menu_templates')
        .select('*')
        .order('name');

      if (templatesError) throw templatesError;

      const templatesWithCourses = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: coursesData, error: coursesError } = await supabase
            .from('tasting_menu_course_templates')
            .select('*')
            .eq('template_id', template.id)
            .order('display_order');

          if (coursesError) throw coursesError;

          return {
            ...template,
            courses: coursesData || []
          };
        })
      );

      setTemplates(templatesWithCourses);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const fetchTastingMenus = useCallback(async () => {
    try {
      const { data: menusData, error: menusError } = await supabase
        .from('tasting_menus')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (menusError) throw menusError;

      const menusWithCourses = await Promise.all(
        (menusData || []).map(async (menu) => {
          const { data: coursesData, error: coursesError } = await supabase
            .from('tasting_menu_courses')
            .select('*')
            .eq('menu_id', menu.id)
            .order('display_order');

          if (coursesError) throw coursesError;

          const coursesWithItems = await Promise.all(
            (coursesData || []).map(async (course) => {
              const { data: itemsData, error: itemsError } = await supabase
                .from('tasting_menu_items')
                .select('*')
                .eq('course_id', course.id)
                .eq('active', true)
                .order('display_order');

              if (itemsError) throw itemsError;

              return {
                ...course,
                items: itemsData || []
              };
            })
          );

          return {
            ...menu,
            courses: coursesWithItems
          };
        })
      );

      setTastingMenus(menusWithCourses);
    } catch (error) {
      console.error('Error fetching tasting menus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([fetchTastingMenus(), fetchTemplates()]).catch((error) => {
      console.error('Error fetching data:', error);
    });
  }, [fetchTastingMenus, fetchTemplates]);

  const handleSaveAsTemplate = async (menu: TastingMenu) => {
    try {
      const { data: template, error: templateError } = await supabase
        .from('tasting_menu_templates')
        .insert([{
          name: `${menu.name} Template`,
          description: menu.description,
          menu_type: menu.menu_type
        }])
        .select()
        .single();

      if (templateError) throw templateError;

      const courseTemplates = menu.courses.map(course => ({
        template_id: template.id,
        name: course.name,
        description: course.description,
        display_order: course.display_order,
        allows_choice: course.allows_choice
      }));

      const { error: coursesError } = await supabase
        .from('tasting_menu_course_templates')
        .insert(courseTemplates);

      if (coursesError) throw coursesError;

      await fetchTemplates();
      alert('Menu saved as template successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template: ' + (error as Error).message);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      const { data: menu, error: menuError } = await supabase
        .from('tasting_menus')
        .insert([{
          name: template.name.replace(' Template', ''),
          description: template.description,
          menu_type: template.menu_type,
          price: 0,
          active: true
        }])
        .select()
        .single();

      if (menuError) throw menuError;

      const courses = template.courses.map(course => ({
        menu_id: menu.id,
        name: course.name,
        description: course.description,
        display_order: course.display_order,
        allows_choice: course.allows_choice
      }));

      const { error: coursesError } = await supabase
        .from('tasting_menu_courses')
        .insert(courses);

      if (coursesError) throw coursesError;

      await fetchTastingMenus();
      alert('Template applied successfully! Please set the menu price.');
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Error applying template: ' + (error as Error).message);
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('Are you sure you want to delete this menu? This will also delete all courses and items.')) return;

    try {
      const { error } = await supabase
        .from('tasting_menus')
        .delete()
        .eq('id', menuId);
      
      if (error) throw error;
      await fetchTastingMenus();
    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('Error deleting menu: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  if (isWizardOpen) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto p-6">
          <TastingMenuWizard
            onComplete={() => {
              setIsWizardOpen(false);
              setEditingMenu(null);
              fetchTastingMenus();
            }}
            onCancel={() => {
              setIsWizardOpen(false);
              setEditingMenu(null);
            }}
            initialData={editingMenu}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Tasting Menus</h1>
          <div className="flex items-center gap-4">
            {templates.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) handleUseTemplate(template);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                value=""
              >
                <option value="">Use Template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setEditingMenu(null);
                setIsWizardOpen(true);
              }}
              className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
            >
              <Plus className="h-5 w-5" />
              Add Menu
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {tastingMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={(menu) => {
                setEditingMenu(menu);
                setIsWizardOpen(true);
              }}
              onDelete={handleDeleteMenu}
              onSaveTemplate={handleSaveAsTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TastingMenusAdmin;
