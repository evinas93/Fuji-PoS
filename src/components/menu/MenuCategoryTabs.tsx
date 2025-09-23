// Menu category tabs component for organizing menu items
import React from 'react';
import { MenuCategory, ItemCategory } from '../../types/database';

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  showAllOption?: boolean;
}

export const MenuCategoryTabs: React.FC<MenuCategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  showAllOption = true
}) => {
  const getCategoryIcon = (categoryType: ItemCategory) => {
    const icons: Record<ItemCategory, string> = {
      red_wine: '🍷',
      white_wine: '🥂',
      blush_wine: '🍾',
      plum_wine: '🍇',
      domestic_beer: '🍺',
      imported_beer: '🍻',
      sake: '🍶',
      beverages: '🥤',
      sushi_rolls: '🍣',
      tempura_appetizer: '🍤',
      lunch_specials: '🍱',
      early_bird: '🌅',
      dinner: '🍽️',
      side_orders: '🥗',
      children_menu: '👶'
    };
    return icons[categoryType] || '🍽️';
  };

  const getCategoryColor = (category: MenuCategory) => {
    if (category.color) return category.color;
    
    // Default colors based on category type
    const colors: Record<ItemCategory, string> = {
      red_wine: 'bg-red-100 text-red-800 border-red-200',
      white_wine: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blush_wine: 'bg-pink-100 text-pink-800 border-pink-200',
      plum_wine: 'bg-purple-100 text-purple-800 border-purple-200',
      domestic_beer: 'bg-amber-100 text-amber-800 border-amber-200',
      imported_beer: 'bg-orange-100 text-orange-800 border-orange-200',
      sake: 'bg-blue-100 text-blue-800 border-blue-200',
      beverages: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      sushi_rolls: 'bg-green-100 text-green-800 border-green-200',
      tempura_appetizer: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      lunch_specials: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      early_bird: 'bg-orange-100 text-orange-800 border-orange-200',
      dinner: 'bg-gray-100 text-gray-800 border-gray-200',
      side_orders: 'bg-lime-100 text-lime-800 border-lime-200',
      children_menu: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    
    return colors[category.category_type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {showAllOption && (
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
            activeCategory === null
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
          }`}
        >
          🍽️ All Items
        </button>
      )}
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
            activeCategory === category.id
              ? 'bg-blue-600 text-white border-blue-600'
              : `${getCategoryColor(category)} hover:border-blue-300`
          }`}
        >
          <span className="mr-2">{getCategoryIcon(category.category_type)}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
};
