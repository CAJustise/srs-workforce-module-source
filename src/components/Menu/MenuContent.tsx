import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { StrengthIndicator } from './StrengthIndicator';
import TastingMenus from './TastingMenus';

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
  ingredients: string[] | null;
  allergens: string[] | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  alcohol_content: number | null;
  garnish: string | null;
  category_id: string | null;
  category: {
    name: string;
    display_order: number;
    parent_id: string | null;
  } | null;
  coda_flight_group?: string | null;
}

interface Category {
  id: string;
  name: string;
  menu_type: string;
  display_order: number;
  parent_id: string | null;
  subcategories?: Category[];
}

// Categories where we don't show alcohol content
const HIDE_ALCOHOL_CONTENT_CATEGORIES = [
  'Flights',
  'Cocktail Flights',
  'Zero Proof',
  'Zero-Proof',
  'Non-Alcoholic',
  'Beer',
  'Wine',
  'Tiki Classic Flight',
  'Spoonbill Signature Flights',
  'Tropical Fruit Flight',
  'Craft Beer',
  'Wine'
];

const CATEGORY_NAV_LABELS: Record<string, string> = {
  'Signature Cocktails': 'Signature',
  'Signature': 'Signature',
  'Happy Hour Specials': 'Happy Hour',
  'Happy Hour': 'Happy Hour',
  'Cocktail Flights': 'Flights',
  'Flights': 'Flights',
  'Cocktail Bowls': 'Bowls',
  'Bowls': 'Bowls',
  'Classic Cocktails': 'Classic',
  'Classic': 'Classic',
  'Zero Proof': 'Zero Proof',
};

const CATEGORY_PILL_LABELS: Record<string, string> = {
  'Signature Cocktails': 'Signature',
  'Signature': 'Signature',
  'Happy Hour Specials': 'Happy Hour',
  'Happy Hour': 'Happy Hour',
  'Cocktail Flights': 'Flights',
  'Flights': 'Flights',
  'Cocktail Bowls': 'Bowls',
  'Bowls': 'Bowls',
  'Classic Cocktails': 'Classic',
  'Classic': 'Classic',
  'Zero Proof': 'Zero Proof',
};

const MenuContent: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeType, setActiveType] = useState<'cocktails' | 'spirits' | 'cuisine' | 'tasting'>('cocktails');
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const findCategoryById = (list: Category[], categoryId: string): Category | null => {
    for (const category of list) {
      if (category.id === categoryId) return category;
      if (category.subcategories?.length) {
        const match = findCategoryById(category.subcategories, categoryId);
        if (match) return match;
      }
    }
    return null;
  };

  const isSpiritsTabRoot = (category: Category | null) => {
    if (!category) return false;
    if (category.id === 'cat_spirits' || category.id === 'cat_beer_wine') return true;
    const normalized = category.name.toLowerCase();
    return normalized.includes('spirit') || normalized.includes('beer') || normalized.includes('wine');
  };

  const shouldShowAlcoholContent = (category: Category | null) => {
    if (!category) return true;
    
    // Check if current category or any parent category is in the hide list
    let currentCat = category;
    while (currentCat) {
      if (HIDE_ALCOHOL_CONTENT_CATEGORIES.includes(currentCat.name)) {
        return false;
      }
      currentCat = categories.find(cat => cat.id === currentCat.parent_id) || null;
    }
    return true;
  };

  const renderDietaryInfo = (item: MenuItem) => {
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

  const renderAllergens = (item: MenuItem) => {
    if (!item.allergens?.length) return null;
    
    return (
      <span className="text-xs text-red-600 font-medium">
        Contains: {item.allergens.join(', ')}
      </span>
    );
  };

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            *,
            category:category_id (
              name,
              display_order,
              parent_id
            )
          `)
          .eq('active', true)
          .order('name'),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('active', true)
          .order('display_order')
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      // Organize categories into a tree structure
      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: Create category objects
      categoriesResponse.data?.forEach(category => {
        categoriesMap.set(category.id, { ...category, subcategories: [] });
      });

      // Second pass: Build tree structure
      categoriesResponse.data?.forEach(category => {
        const categoryWithSubs = categoriesMap.get(category.id)!;
        if (category.parent_id) {
          const parent = categoriesMap.get(category.parent_id);
          if (parent) {
            parent.subcategories?.push(categoryWithSubs);
          }
        } else {
          rootCategories.push(categoryWithSubs);
        }
      });

      // Sort subcategories by display_order
      const sortSubcategories = (categories: Category[]) => {
        categories.sort((a, b) => a.display_order - b.display_order);
        categories.forEach(category => {
          if (category.subcategories?.length) {
            sortSubcategories(category.subcategories);
          }
        });
      };

      sortSubcategories(rootCategories);

      setMenuItems(itemsResponse.data || []);
      setCategories(rootCategories);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRootCategory = (categoryId: string | null) => {
    if (!categoryId) return null;

    let current = findCategoryById(categories, categoryId);
    while (current?.parent_id) {
      current = findCategoryById(categories, current.parent_id);
    }

    return current;
  };

  const isSpiritCategory = (item: MenuItem) => {
    const root = getRootCategory(item.category_id);
    return isSpiritsTabRoot(root);
  };

  const isSpiritRootCategory = (category: Category) => {
    const root = getRootCategory(category.id) || category;
    return isSpiritsTabRoot(root);
  };

  const filteredItems = menuItems.filter((item) => {
    if (activeType === 'tasting') return false;
    if (activeType === 'cuisine') return item.menu_type === 'food';
    if (activeType === 'cocktails') {
      return item.menu_type === 'drinks' && !isSpiritCategory(item);
    }
    return item.menu_type === 'drinks' && isSpiritCategory(item);
  });

  const filteredCategories = categories.filter((category) => {
    if (activeType === 'tasting') return false;
    if (activeType === 'cuisine') return category.menu_type === 'food';
    if (activeType === 'cocktails') {
      return category.menu_type === 'drinks' && !isSpiritRootCategory(category);
    }
    return category.menu_type === 'drinks' && isSpiritRootCategory(category);
  });

  const getCategoryNavLabel = (categoryName: string) =>
    CATEGORY_NAV_LABELS[categoryName] || categoryName;

  const getCategoryDisplayLabel = (categoryName: string) =>
    CATEGORY_PILL_LABELS[categoryName] || categoryName.replace(/\bCocktails?\b/gi, '').replace(/\s+/g, ' ').trim() || categoryName;

  const normalizeMenuName = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

  const categoryHasItems = (category: Category): boolean => {
    if (filteredItems.some((item) => item.category_id === category.id)) {
      return true;
    }
    return (category.subcategories || []).some((subcategory) => categoryHasItems(subcategory));
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const scrollContainer = element.closest('.overflow-y-auto');
    if (!scrollContainer) return;

    const headerHeight = headerRef.current?.offsetHeight || 0;
    const elementTop = element.offsetTop;
    
    scrollContainer.scrollTo({
      top: elementTop - headerHeight - 16,
      behavior: 'smooth'
    });
  };

  const isWineItem = (item: MenuItem) => {
    const rootCategory = getRootCategory(item.category_id);
    const rootName = rootCategory?.name.toLowerCase() || '';
    const isBeerWineRoot =
      rootCategory?.id === 'cat_beer_wine' || rootName.includes('beer') || rootName.includes('wine');
    if (!isBeerWineRoot) return false;

    // Check if the item is in a wine category or subcategory
    let currentCat = item.category_id ? findCategoryById(categories, item.category_id) : null;
    while (currentCat) {
      const normalized = currentCat.name.toLowerCase();
      if (
        normalized.includes('wine') ||
        normalized === 'champagne' ||
        normalized.includes('sparkling') ||
        normalized.includes('rose')
      ) {
        return true;
      }
      currentCat = currentCat.parent_id ? findCategoryById(categories, currentCat.parent_id) : null;
    }
    return false;
  };

  const renderPrices = (item: MenuItem) => {
    if (!item.show_price) return null;

    if (isWineItem(item)) {
      return (
        <div className="font-garamond text-lg text-gray-700 text-right">
          {item.price && (
            <span>Glass ${item.price.toFixed(2)}</span>
          )}
          {item.bottle_price && (
            <div>Bottle ${item.bottle_price.toFixed(2)}</div>
          )}
        </div>
      );
    }

    return item.price && (
      <span className="font-garamond text-lg text-gray-700">
        ${item.price.toFixed(2)}
      </span>
    );
  };

  const renderMenuItemCard = (item: MenuItem, options?: { forceAlcoholIndicator?: boolean }) => {
    const parsedAlcoholStrength =
      item.alcohol_content === null || item.alcohol_content === undefined
        ? null
        : Number(item.alcohol_content);
    const showAlcoholIndicator =
      parsedAlcoholStrength !== null &&
      Number.isFinite(parsedAlcoholStrength) &&
      parsedAlcoholStrength > 0 &&
      (options?.forceAlcoholIndicator || shouldShowAlcoholContent(item.category));

    return (
      <div className="group">
      {item.image_url && (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-48 object-cover"
          />
          {item.show_description && item.description && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-white font-garamond text-center px-6">
                {item.description}
              </p>
            </div>
          )}
        </div>
      )}
      <div className={`flex justify-between items-start ${item.image_url ? 'mt-4' : 'mt-1'}`}>
        <div>
          <h4 className="text-xl font-garamond font-medium text-gray-900 mb-1">
            {item.name}
          </h4>
          {isWineItem(item) && item.description && (
            <p className="text-sm text-gray-600 font-garamond">
              {item.description}
            </p>
          )}
          {showAlcoholIndicator && (
            <div className="mt-1">
              <StrengthIndicator
                strength={parsedAlcoholStrength}
                className="h-6 w-6"
              />
            </div>
          )}
        </div>
        {renderPrices(item)}
      </div>
      {item.ingredients && item.ingredients.length > 0 && (
        <div className="space-y-1 mt-2">
          <p className="text-sm text-gray-500 font-garamond">
            {item.ingredients.join(' • ')}
          </p>
          <div className="flex items-center gap-4 text-sm">
            {renderDietaryInfo(item)}
            {renderAllergens(item)}
          </div>
        </div>
      )}
      {(activeType === 'cocktails' || activeType === 'spirits') && !isWineItem(item) && item.garnish && (
        <p className="text-sm text-gray-500 font-garamond italic mt-1">
          Garnished with {item.garnish}
        </p>
      )}
      </div>
    );
  };

  const renderFlightsSubcategory = (subcategory: Category, subcategoryItems: MenuItem[]) => {
    const drinkByName = new Map(
      filteredItems
        .filter((item) => item.menu_type === 'drinks' && item.category_id !== subcategory.id)
        .map((item) => [normalizeMenuName(item.name), item]),
    );

    const orderedFlights = [...subcategoryItems].sort((a, b) => {
      const aPrice = a.price ?? 0;
      const bPrice = b.price ?? 0;
      if (aPrice !== bPrice) return aPrice - bPrice;
      return a.name.localeCompare(b.name);
    });

    return (
      <div key={subcategory.id} id={`subcategory-${subcategory.id}`} className="space-y-6">
        <div className="flex justify-center">
          <h4 className="text-lg font-display font-semibold text-ocean-700 text-center">
            {getCategoryDisplayLabel(subcategory.name)}
          </h4>
        </div>

        {orderedFlights.map((flightItem) => {
          const flightDrinks = (flightItem.ingredients || [])
            .map((drinkName) => drinkByName.get(normalizeMenuName(drinkName)))
            .filter((drink): drink is MenuItem => Boolean(drink));

          return (
            <div key={flightItem.id} className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="font-display font-semibold text-ocean-700">
                  {flightItem.name}
                </div>
                {flightItem.price != null && (
                  <span className="font-garamond text-xl text-gray-700">
                    ${flightItem.price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="grid gap-4">
                {(flightDrinks.length ? flightDrinks : [flightItem]).map((drinkItem) => (
                  <div key={`${flightItem.id}-${drinkItem.id}`}>
                    {renderMenuItemCard(drinkItem, { forceAlcoholIndicator: true })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isFlightsSubcategory = (subcategory: Category) => {
    const normalizedLabel = getCategoryDisplayLabel(subcategory.name).toLowerCase();
    return (
      subcategory.id === 'cat_flights' ||
      normalizedLabel === 'flights' ||
      subcategory.name.toLowerCase().includes('flight')
    );
  };

  const renderSubcategoryContent = (subcategory: Category, depth = 0) => {
    const directItems = filteredItems.filter((item) => item.category_id === subcategory.id);
    const nestedSubcategories = (subcategory.subcategories || [])
      .filter((child) => categoryHasItems(child))
      .sort((a, b) => a.display_order - b.display_order);

    if (!directItems.length && !nestedSubcategories.length) return null;

    if (isFlightsSubcategory(subcategory) && !nestedSubcategories.length) {
      return renderFlightsSubcategory(subcategory, directItems);
    }

    return (
      <div key={subcategory.id} id={`subcategory-${subcategory.id}`} className="space-y-6">
        <div className={depth > 0 ? 'flex justify-start' : 'flex justify-center'}>
          <h4
            className={
              depth > 0
                ? 'text-base font-display font-semibold text-ocean-700'
                : 'text-lg font-display font-semibold text-ocean-700'
            }
          >
            {getCategoryDisplayLabel(subcategory.name)}
          </h4>
        </div>

        {directItems.length > 0 && (
          <div className="grid gap-4">
            {directItems.map((item) => (
              <div key={item.id}>
                {renderMenuItemCard(item)}
              </div>
            ))}
          </div>
        )}

        {nestedSubcategories.length > 0 && (
          <div className="space-y-8">
            {nestedSubcategories.map((child) => renderSubcategoryContent(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryContent = (category: Category) => {
    const directCategoryItems = filteredItems.filter((item) => item.category_id === category.id);

    const subcategoriesWithItems = (category.subcategories || []).filter((subcategory) =>
      categoryHasItems(subcategory),
    );

    if (!directCategoryItems.length && !subcategoriesWithItems.length) return null;

    const isCocktailsRoot =
      activeType === 'cocktails' &&
      (category.id === 'cat_cocktails' || category.name.toLowerCase() === 'cocktails');
    const isCuisineRoot =
      activeType === 'cuisine' &&
      (category.id === 'cat_cuisine' || category.name.toLowerCase() === 'cuisine');

    return (
      <div key={category.id} id={`category-${category.id}`} className="space-y-8">
        {!isCocktailsRoot && !isCuisineRoot && (
          <div className="relative">
            <h3 className="text-2xl font-display font-bold text-ocean-800 pb-3 border-b-2 border-ocean-200">
              {category.name}
            </h3>
            <div className="absolute bottom-0 left-0 w-24 h-0.5 bg-ocean-600"></div>
          </div>
        )}

        {subcategoriesWithItems.map((subcategory) => renderSubcategoryContent(subcategory))}

        {directCategoryItems.length > 0 && (
          <div className="grid gap-4">
            {directCategoryItems.map((item) => (
              <div key={item.id}>
                {renderMenuItemCard(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  const rootCategories = filteredCategories
    .filter((category) => !category.parent_id)
    .sort((a, b) => a.display_order - b.display_order);

  const cocktailsRootCategory =
    activeType === 'cocktails'
      ? rootCategories.find((category) => category.id === 'cat_cocktails') ||
        rootCategories.find((category) => category.name.toLowerCase() === 'cocktails') ||
        null
      : null;
  const cuisineRootCategory =
    activeType === 'cuisine'
      ? rootCategories.find((category) => category.id === 'cat_cuisine') ||
        rootCategories.find((category) => category.name.toLowerCase() === 'cuisine') ||
        null
      : null;

  const navTargets =
    cocktailsRootCategory && activeType === 'cocktails'
      ? (cocktailsRootCategory.subcategories || [])
          .filter((subcategory) => categoryHasItems(subcategory))
          .sort((a, b) => a.display_order - b.display_order)
          .map((subcategory) => ({
            id: `subcategory-${subcategory.id}`,
            label: getCategoryNavLabel(subcategory.name),
          }))
      : cuisineRootCategory && activeType === 'cuisine'
        ? (cuisineRootCategory.subcategories || [])
            .filter((subcategory) => categoryHasItems(subcategory))
            .sort((a, b) => a.display_order - b.display_order)
            .map((subcategory) => ({
              id: `subcategory-${subcategory.id}`,
              label: subcategory.name,
            }))
      : rootCategories
          .filter((category) => categoryHasItems(category))
          .map((category) => ({
          id: `category-${category.id}`,
          label: category.name,
        }));

  return (
    <div className="relative">
      {/* Sticky Header */}
      <div ref={headerRef} className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 -mx-6 px-6 pt-4 pb-4">
        {/* Menu Type Selector */}
        <div className="grid grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => setActiveType('cocktails')}
            className={`py-4 text-lg font-garamond transition-colors ${
              activeType === 'cocktails'
                ? 'bg-ocean-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cocktails
          </button>
          <button
            onClick={() => setActiveType('spirits')}
            className={`py-4 text-lg font-garamond transition-colors ${
              activeType === 'spirits'
                ? 'bg-ocean-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Spirits
          </button>
          <button
            onClick={() => setActiveType('cuisine')}
            className={`py-4 text-lg font-garamond transition-colors ${
              activeType === 'cuisine'
                ? 'bg-ocean-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cuisine
          </button>
          <button
            onClick={() => setActiveType('tasting')}
            className={`py-4 text-lg font-garamond transition-colors ${
              activeType === 'tasting'
                ? 'bg-ocean-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tastings
          </button>
        </div>

        {/* Category Navigation - Only show main categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {navTargets.map((target) => (
            <button
              key={target.id}
              onClick={() => scrollToSection(target.id)}
              className="px-1 py-1 text-sm font-display font-semibold text-ocean-700 underline-offset-4 hover:underline transition-colors"
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      {activeType === 'tasting' ? (
        <div className="pt-4">
          <TastingMenus />
        </div>
      ) : (
        <div ref={contentRef} className="space-y-12 pt-4">
          {rootCategories.map((category) => renderCategoryContent(category))}
        </div>
      )}
    </div>
  );
};

export default MenuContent;
