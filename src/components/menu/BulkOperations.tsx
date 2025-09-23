// Bulk operations component for menu management
import React, { useState } from 'react';
import { MenuCategory } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BulkOperationsProps {
  categories: MenuCategory[];
  onBulkUpdate: (operation: string, data: any) => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  categories,
  onBulkUpdate
}) => {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkPriceUpdate = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    if (priceMultiplier <= 0) {
      alert('Price multiplier must be greater than 0');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'price_update',
          category_id: selectedCategory,
          price_multiplier: priceMultiplier,
          price_adjustment: priceAdjustment
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully updated ${result.count} items`);
        onBulkUpdate('price_update', result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to update prices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAvailabilityUpdate = async (makeAvailable: boolean) => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'availability_update',
          category_id: selectedCategory,
          is_available: makeAvailable
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully ${makeAvailable ? 'enabled' : 'disabled'} ${result.count} items`);
        onBulkUpdate('availability_update', result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to update availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReorder = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'reorder_items',
          category_id: selectedCategory
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Successfully reordered ${result.count} items`);
        onBulkUpdate('reorder_items', result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to reorder items');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Bulk Operations</h3>

      {/* Operation Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Operation
        </label>
        <select
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose an operation...</option>
          <option value="price_update">Bulk Price Update</option>
          <option value="availability_update">Bulk Availability Update</option>
          <option value="reorder_items">Reorder Items</option>
        </select>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Update Form */}
      {selectedOperation === 'price_update' && (
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900">Price Update Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Multiplier (e.g., 1.1 for 10% increase)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(parseFloat(e.target.value) || 1.0)}
                placeholder="1.0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Adjustment (fixed amount to add/subtract)
              </label>
              <Input
                type="number"
                step="0.01"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Example:</strong> If an item costs $10.00 and you set multiplier to 1.1 and adjustment to 0.50, 
              the new price will be: ($10.00 × 1.1) + $0.50 = $11.50
            </p>
          </div>

          <Button
            onClick={handleBulkPriceUpdate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Prices'}
          </Button>
        </div>
      )}

      {/* Availability Update */}
      {selectedOperation === 'availability_update' && (
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900">Availability Update</h4>
          
          <div className="flex gap-4">
            <Button
              onClick={() => handleBulkAvailabilityUpdate(true)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Make All Available'}
            </Button>
            
            <Button
              onClick={() => handleBulkAvailabilityUpdate(false)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Make All Unavailable'}
            </Button>
          </div>
        </div>
      )}

      {/* Reorder Items */}
      {selectedOperation === 'reorder_items' && (
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900">Reorder Items</h4>
          
          <p className="text-sm text-gray-600">
            This will reset the display order of items in the selected category alphabetically.
          </p>
          
          <Button
            onClick={handleBulkReorder}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Reordering...' : 'Reorder Items'}
          </Button>
        </div>
      )}

      {/* Warning */}
      {selectedOperation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Bulk operations cannot be undone. Please review your changes carefully before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
