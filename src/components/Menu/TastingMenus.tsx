import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
  courses: TastingMenuCourse[];
}

const TastingMenus: React.FC = () => {
  const [tastingMenus, setTastingMenus] = useState<TastingMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTastingMenus();
  }, []);

  const fetchTastingMenus = async () => {
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
  };

  const renderDietaryInfo = (item: TastingMenuItem) => {
    if (!item.is_vegetarian && !item.is_vegan && !item.is_gluten_free) return null;
    
    return (
      <div className="flex gap-2">
        {item.is_vegetarian && !item.is_vegan && (
          <span className="text-xs font-medium text-ocean-600">V</span>
        )}
        {item.is_vegan && (
          <span className="text-xs font-medium text-ocean-600">VG</span>
        )}
        {item.is_gluten_free && (
          <span className="text-xs font-medium text-ocean-600">GF</span>
        )}
      </div>
    );
  };

  const renderAllergens = (item: TastingMenuItem) => {
    if (!item.allergens?.length) return null;
    
    return (
      <span className="text-xs text-red-600 font-medium">
        Contains: {item.allergens.join(', ')}
      </span>
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
    <div className="space-y-16">
      {tastingMenus.map((menu) => (
        <div key={menu.id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <div className="bg-ocean-600 text-white p-6">
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-display font-bold">{menu.name}</h3>
              <span className="text-xl font-garamond">${menu.price.toFixed(2)}</span>
            </div>
            {menu.description && (
              <p className="mt-2 font-garamond text-white/90">{menu.description}</p>
            )}
          </div>

          <div className="p-6 space-y-8">
            {menu.courses.map((course) => (
              <div key={course.id} className="space-y-4">
                {menu.menu_type === 'prix_fixe' && (
                  <div className="flex items-baseline gap-4">
                    <h4 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">
                      {course.name}
                    </h4>
                    {course.allows_choice && (
                      <span className="text-sm text-ocean-600 font-medium">
                        (Choice of One)
                      </span>
                    )}
                  </div>
                )}

                {course.description && menu.menu_type === 'prix_fixe' && (
                  <p className="text-gray-600 font-garamond">
                    {course.description}
                  </p>
                )}

                <div className="space-y-6">
                  {course.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <h5 className="text-xl font-display text-gray-900 font-medium">
                        {item.name}
                      </h5>
                      {item.description && (
                        <p className="text-gray-600 font-garamond text-sm">
                          {item.description}
                        </p>
                      )}
                      {(item.ingredients?.length || item.allergens?.length) && (
                        <div className="space-y-1">
                          {item.ingredients?.length > 0 && (
                            <p className="text-base text-gray-700 font-garamond font-bold">
                              {item.ingredients.join(' • ')}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            {renderDietaryInfo(item)}
                            {renderAllergens(item)}
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
      ))}
    </div>
  );
};

export default TastingMenus;