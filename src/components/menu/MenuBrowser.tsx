// Menu browser component for servers to view and select menu items
import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '../../types/database';
import { MenuItemCard } from './MenuItemCard';
import { MenuCategoryTabs } from './MenuCategoryTabs';

interface MenuBrowserProps {
  onAddToOrder: (item: MenuItem) => void;
  showUnavailable?: boolean;
}

export const MenuBrowser: React.FC<MenuBrowserProps> = ({ 
  onAddToOrder, 
  showUnavailable = false 
}) => {
  const [menuItems, setMenuItems] = useState<(MenuItem & { menu_categories?: MenuCategory })[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  // Load menu items when category changes
  useEffect(() => {
    loadMenuItems();
  }, [activeCategory, searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories');
      const result = await response.json();
      
      if (response.ok) {
        setCategories(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load categories');
    }
  };

  const loadMenuItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (!showUnavailable) params.append('available', 'true');
      
      const response = await fetch(`/api/menu/items?${params.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        setMenuItems(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (activeCategory && item.category_id !== activeCategory) {
      return false;
    }
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (!showUnavailable && !item.is_available) {
      return false;
    }
    return true;
  });

  // Group items by category for better organization
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const categoryName = item.menu_categories?.name || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, (MenuItem & { menu_categories?: MenuCategory })[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <MenuCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showAllOption={true}
        />
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading menu...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(itemsByCategory).map(([categoryName, items]) => (
              <div key={categoryName}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{categoryName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      showAdminControls={false}
                      showOrderButton={true}
                      onAddToOrder={onAddToOrder}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchTerm ? 'No items found matching your search.' : 'No menu items available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
