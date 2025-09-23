// Menu item card component for displaying menu items
import React from 'react';
import { MenuItem, MenuCategory } from '../../types/database';
import { Button } from '../ui/Button';

interface MenuItemCardProps {
  item: MenuItem & { menu_categories?: MenuCategory };
  onEdit?: (item: MenuItem) => void;
  onToggleAvailability?: (itemId: string, isAvailable: boolean) => void;
  onAddToOrder?: (item: MenuItem) => void;
  showAdminControls?: boolean;
  showOrderButton?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onToggleAvailability,
  onAddToOrder,
  showAdminControls = false,
  showOrderButton = true
}) => {
  const getDisplayPrice = () => {
    if (item.glass_price && item.bottle_price) {
      return `$${item.glass_price.toFixed(2)} / $${item.bottle_price.toFixed(2)}`;
    }
    if (item.lunch_price && item.dinner_price) {
      return `$${item.lunch_price.toFixed(2)} / $${item.dinner_price.toFixed(2)}`;
    }
    return `$${item.base_price.toFixed(2)}`;
  };

  const getDietaryFlags = () => {
    const flags = [];
    if (item.is_vegetarian) flags.push('V');
    if (item.is_gluten_free) flags.push('GF');
    if (item.is_raw) flags.push('Raw');
    if (item.spicy_level && item.spicy_level > 0) {
      flags.push(`${'🌶️'.repeat(item.spicy_level)}`);
    }
    return flags;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border ${
      !item.is_available ? 'opacity-60' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          {item.menu_categories && (
            <p className="text-sm text-gray-500">{item.menu_categories.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">{getDisplayPrice()}</p>
          {getDietaryFlags().length > 0 && (
            <p className="text-xs text-gray-600">{getDietaryFlags().join(' ')}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-gray-700 text-sm mb-3">{item.description}</p>
      )}

      {/* Dietary Info */}
      <div className="flex flex-wrap gap-2 mb-3">
        {item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0 && (
          <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            Contains: {item.allergens.join(', ')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {showOrderButton && (
            <Button
              onClick={() => onAddToOrder?.(item)}
              disabled={!item.is_available}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              Add to Order
            </Button>
          )}
        </div>

        {showAdminControls && (
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit?.(item)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => onToggleAvailability?.(item.id, !item.is_available)}
              className={`px-3 py-1 rounded text-sm ${
                item.is_available
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {item.is_available ? 'Hide' : 'Show'}
            </Button>
          </div>
        )}
      </div>

      {/* Availability Status */}
      {!item.is_available && (
        <div className="mt-2 text-center">
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
            Currently Unavailable
          </span>
        </div>
      )}
    </div>
  );
};
