// Menu item form component for creating and editing menu items
import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory, Modifier } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MenuItemFormProps {
  item?: MenuItem;
  categories: MenuCategory[];
  modifiers: Modifier[];
  onSubmit: (item: Partial<MenuItem>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
  item,
  categories,
  modifiers,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category_id: item?.category_id || '',
    base_price: item?.base_price || 0,
    glass_price: item?.glass_price || '',
    bottle_price: item?.bottle_price || '',
    lunch_price: item?.lunch_price || '',
    dinner_price: item?.dinner_price || '',
    cost: item?.cost || '',
    preparation_time: item?.preparation_time || 15,
    calories: item?.calories || '',
    spicy_level: item?.spicy_level || 0,
    is_raw: item?.is_raw || false,
    is_vegetarian: item?.is_vegetarian || false,
    is_gluten_free: item?.is_gluten_free || false,
    is_featured: item?.is_featured || false,
    allergens: item?.allergens ? (item.allergens as string[]).join(', ') : '',
    selectedModifiers: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category_id: item.category_id || '',
        base_price: item.base_price || 0,
        glass_price: item.glass_price || '',
        bottle_price: item.bottle_price || '',
        lunch_price: item.lunch_price || '',
        dinner_price: item.dinner_price || '',
        cost: item.cost || '',
        preparation_time: item.preparation_time || 15,
        calories: item.calories || '',
        spicy_level: item.spicy_level || 0,
        is_raw: item.is_raw || false,
        is_vegetarian: item.is_vegetarian || false,
        is_gluten_free: item.is_gluten_free || false,
        is_featured: item.is_featured || false,
        allergens: item.allergens ? (item.allergens as string[]).join(', ') : '',
        selectedModifiers: []
      });
    }
  }, [item]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (formData.base_price <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }

    if (formData.preparation_time <= 0) {
      newErrors.preparation_time = 'Preparation time must be greater than 0';
    }

    if (formData.calories && (formData.calories < 0 || formData.calories > 9999)) {
      newErrors.calories = 'Calories must be between 0 and 9999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      base_price: parseFloat(formData.base_price.toString()),
      glass_price: formData.glass_price ? parseFloat(formData.glass_price.toString()) : null,
      bottle_price: formData.bottle_price ? parseFloat(formData.bottle_price.toString()) : null,
      lunch_price: formData.lunch_price ? parseFloat(formData.lunch_price.toString()) : null,
      dinner_price: formData.dinner_price ? parseFloat(formData.dinner_price.toString()) : null,
      cost: formData.cost ? parseFloat(formData.cost.toString()) : null,
      preparation_time: parseInt(formData.preparation_time.toString()),
      calories: formData.calories ? parseInt(formData.calories.toString()) : null,
      spicy_level: parseInt(formData.spicy_level.toString()),
      allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()).filter(a => a) : []
    };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const groupedModifiers = modifiers.reduce((acc, modifier) => {
    const group = modifier.modifier_group || 'other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(modifier);
    return acc;
  }, {} as Record<string, Modifier[]>);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">
        {item ? 'Edit Menu Item' : 'Add New Menu Item'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter item name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter item description"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={(e) => handleInputChange('base_price', e.target.value)}
              className={errors.base_price ? 'border-red-500' : ''}
              placeholder="0.00"
            />
            {errors.base_price && <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Glass Price
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.glass_price}
              onChange={(e) => handleInputChange('glass_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bottle Price
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.bottle_price}
              onChange={(e) => handleInputChange('bottle_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Additional Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lunch Price
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.lunch_price}
              onChange={(e) => handleInputChange('lunch_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dinner Price
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.dinner_price}
              onChange={(e) => handleInputChange('dinner_price', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Item Properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation Time (minutes) *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.preparation_time}
              onChange={(e) => handleInputChange('preparation_time', e.target.value)}
              className={errors.preparation_time ? 'border-red-500' : ''}
            />
            {errors.preparation_time && <p className="text-red-500 text-sm mt-1">{errors.preparation_time}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calories
            </label>
            <Input
              type="number"
              min="0"
              max="9999"
              value={formData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              className={errors.calories ? 'border-red-500' : ''}
            />
            {errors.calories && <p className="text-red-500 text-sm mt-1">{errors.calories}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spicy Level (0-5)
            </label>
            <select
              value={formData.spicy_level}
              onChange={(e) => handleInputChange('spicy_level', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[0, 1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>
                  {level === 0 ? 'Mild' : '🌶️'.repeat(level)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dietary Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Information
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_vegetarian}
                onChange={(e) => handleInputChange('is_vegetarian', e.target.checked)}
                className="mr-2"
              />
              Vegetarian
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_gluten_free}
                onChange={(e) => handleInputChange('is_gluten_free', e.target.checked)}
                className="mr-2"
              />
              Gluten Free
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_raw}
                onChange={(e) => handleInputChange('is_raw', e.target.checked)}
                className="mr-2"
              />
              Raw
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                className="mr-2"
              />
              Featured
            </label>
          </div>
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allergens (comma-separated)
          </label>
          <Input
            type="text"
            value={formData.allergens}
            onChange={(e) => handleInputChange('allergens', e.target.value)}
            placeholder="nuts, dairy, soy, etc."
          />
        </div>

        {/* Modifiers */}
        {Object.keys(groupedModifiers).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Modifiers
            </label>
            <div className="space-y-4">
              {Object.entries(groupedModifiers).map(([group, groupModifiers]) => (
                <div key={group}>
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{group}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {groupModifiers.map((modifier) => (
                      <label key={modifier.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedModifiers.includes(modifier.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('selectedModifiers', [...formData.selectedModifiers, modifier.id]);
                            } else {
                              handleInputChange('selectedModifiers', formData.selectedModifiers.filter(id => id !== modifier.id));
                            }
                          }}
                          className="mr-2"
                        />
                        {modifier.name} {modifier.price > 0 && `(+$${modifier.price.toFixed(2)})`}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
          </Button>
        </div>
      </form>
    </div>
  );
};
