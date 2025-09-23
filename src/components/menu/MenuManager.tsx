// Menu management component for managers and admins
import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory, Modifier } from '../../types/database';
import { MenuItemCard } from './MenuItemCard';
import { MenuCategoryTabs } from './MenuCategoryTabs';
import { MenuItemForm } from './MenuItemForm';
import { CategoryManager } from './CategoryManager';
import { BulkOperations } from './BulkOperations';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MenuManagerProps {
  userRole: string;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ userRole }) => {
  const [menuItems, setMenuItems] = useState<(MenuItem & { menu_categories?: MenuCategory })[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadModifiers();
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

  const loadModifiers = async () => {
    try {
      const response = await fetch('/api/menu/modifiers');
      const result = await response.json();
      
      if (response.ok) {
        // Flatten grouped modifiers
        const allModifiers = Object.values(result.data).flat() as Modifier[];
        setModifiers(allModifiers);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load modifiers');
    }
  };

  const loadMenuItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (searchTerm) params.append('search', searchTerm);
      
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

  const handleCreateItem = async (itemData: Partial<MenuItem>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        await loadMenuItems();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to create menu item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (itemData: Partial<MenuItem>) => {
    if (!editingItem) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem.id, ...itemData })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setShowForm(false);
        setEditingItem(null);
        await loadMenuItems();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update menu item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch('/api/menu/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, is_available: isAvailable })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await loadMenuItems();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu/items?id=${itemId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await loadMenuItems();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to delete menu item');
    }
  };

  const handleUpdateCategories = async (updatedCategories: MenuCategory[]) => {
    try {
      // Update display orders for all categories
      for (const category of updatedCategories) {
        const response = await fetch('/api/menu/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: category.id,
            display_order: category.display_order
          })
        });

        if (!response.ok) {
          const result = await response.json();
          setError(result.error);
          return;
        }
      }

      await loadCategories();
    } catch (error) {
      setError('Failed to update category order');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu/categories?id=${categoryId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        await loadCategories();
        await loadMenuItems();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to delete category');
    }
  };

  const handleEditCategory = (category: MenuCategory) => {
    // For now, just show an alert. In a full implementation, you'd open an edit form
    alert(`Edit category: ${category.name}\nThis feature can be expanded with a category edit form.`);
  };

  const handleBulkUpdate = async (operation: string, data: any) => {
    await loadMenuItems();
    await loadCategories();
  };

  const filteredItems = menuItems.filter(item => {
    if (activeCategory && item.category_id !== activeCategory) {
      return false;
    }
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (showForm) {
    return (
      <MenuItemForm
        item={editingItem || undefined}
        categories={categories}
        modifiers={modifiers}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        onCancel={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        isLoading={isLoading}
      />
    );
  }

  if (showCategoryManager) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <Button
            onClick={() => setShowCategoryManager(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Menu
          </Button>
        </div>
        
        <CategoryManager
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          onDeleteCategory={handleDeleteCategory}
          onEditCategory={handleEditCategory}
        />
      </div>
    );
  }

  if (showBulkOperations) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
          <Button
            onClick={() => setShowBulkOperations(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Menu
          </Button>
        </div>
        
        <BulkOperations
          categories={categories}
          onBulkUpdate={handleBulkUpdate}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        <div className="flex gap-2">
          {['admin', 'manager'].includes(userRole) && (
            <>
              <Button
                onClick={() => setShowCategoryManager(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Manage Categories
              </Button>
              <Button
                onClick={() => setShowBulkOperations(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
              >
                Bulk Operations
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Add New Item
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <MenuCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          showAllOption={true}
        />
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading menu items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              showAdminControls={['admin', 'manager'].includes(userRole)}
              showOrderButton={false}
              onEdit={(item) => {
                setEditingItem(item);
                setShowForm(true);
              }}
              onToggleAvailability={handleToggleAvailability}
            />
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
  );
};
