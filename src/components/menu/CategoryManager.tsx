// Category management component with drag-and-drop ordering
import React, { useState, useEffect } from 'react';
import { MenuCategory } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CategoryManagerProps {
  categories: MenuCategory[];
  onUpdateCategories: (categories: MenuCategory[]) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditCategory: (category: MenuCategory) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onUpdateCategories,
  onDeleteCategory,
  onEditCategory
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    category_type: 'dinner' as any,
    icon: '',
    color: ''
  });

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedItem(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetCategoryId) {
      return;
    }

    const draggedIndex = categories.findIndex(c => c.id === draggedItem);
    const targetIndex = categories.findIndex(c => c.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Create new categories array with updated display orders
    const newCategories = [...categories];
    const draggedCategory = newCategories[draggedIndex];
    
    // Remove dragged item
    newCategories.splice(draggedIndex, 1);
    
    // Insert at new position
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Update display orders
    const updatedCategories = newCategories.map((category, index) => ({
      ...category,
      display_order: index + 1
    }));

    onUpdateCategories(updatedCategories);
    setDraggedItem(null);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      const result = await response.json();

      if (response.ok) {
        setNewCategory({ name: '', category_type: 'dinner', icon: '', color: '' });
        setShowAddForm(false);
        // Refresh categories
        window.location.reload();
      } else {
        console.error('Failed to create category:', result.error);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const getCategoryIcon = (categoryType: string) => {
    const icons: Record<string, string> = {
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
    
    const colors: Record<string, string> = {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Menu Categories</h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add Category
        </Button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <Input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Type
              </label>
              <select
                value={newCategory.category_type}
                onChange={(e) => setNewCategory({ ...newCategory, category_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dinner">Dinner</option>
                <option value="sushi_rolls">Sushi Rolls</option>
                <option value="red_wine">Red Wine</option>
                <option value="white_wine">White Wine</option>
                <option value="blush_wine">Blush Wine</option>
                <option value="plum_wine">Plum Wine</option>
                <option value="domestic_beer">Domestic Beer</option>
                <option value="imported_beer">Imported Beer</option>
                <option value="sake">Sake</option>
                <option value="beverages">Beverages</option>
                <option value="tempura_appetizer">Tempura Appetizer</option>
                <option value="lunch_specials">Lunch Specials</option>
                <option value="early_bird">Early Bird</option>
                <option value="side_orders">Side Orders</option>
                <option value="children_menu">Children's Menu</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Add Category
            </Button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {categories
          .sort((a, b) => a.display_order - b.display_order)
          .map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`p-4 rounded-lg border-2 cursor-move transition-colors ${
                draggedItem === category.id ? 'opacity-50' : ''
              } ${getCategoryColor(category)}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCategoryIcon(category.category_type)}</span>
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm opacity-75">Order: {category.display_order}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onEditCategory(category)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDeleteCategory(category.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No categories found.</p>
        </div>
      )}
    </div>
  );
};
