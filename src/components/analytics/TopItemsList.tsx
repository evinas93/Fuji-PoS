// Top Selling Items List Component
import React from 'react';

interface TopItem {
  id: string;
  name: string;
  category?: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  rank?: number;
}

interface TopItemsListProps {
  items: TopItem[];
  className?: string;
  limit?: number;
}

export const TopItemsList: React.FC<TopItemsListProps> = ({
  items,
  className = '',
  limit = 10
}) => {
  if (!items || items.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No sales data available</p>
      </div>
    );
  }

  // Sort by quantity and limit results - Following PRD format: "1. Cal Roll (45)"
  const topItems = items
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);

  return (
    <div className={className}>
      <div className="space-y-3">
        {topItems.map((item, index) => {
          const rank = index + 1;
          const avgPrice = item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  rank === 1 ? 'bg-yellow-500 text-white' :
                  rank === 2 ? 'bg-gray-400 text-white' :
                  rank === 3 ? 'bg-orange-500 text-white' :
                  'bg-gray-300 text-gray-700'
                }`}>
                  {rank}
                </div>

                {/* Item Info */}
                <div>
                  <p className="font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.category} • {item.orderCount} orders
                  </p>
                </div>
              </div>

              <div className="text-right">
                {/* Quantity - Following PRD format: "Cal Roll (45)" */}
                <p className="text-lg font-bold text-gray-900">
                  ({item.totalQuantity})
                </p>
                <p className="text-sm text-gray-500">
                  ${item.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Bar */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Top Item</p>
            <p className="font-bold text-gray-900 truncate">
              {topItems[0]?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Units Sold</p>
            <p className="font-bold text-gray-900">
              {topItems[0]?.totalQuantity || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="font-bold text-gray-900">
              ${(topItems[0]?.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopItemsList;