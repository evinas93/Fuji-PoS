// Item Profitability Table Component
import React, { useState } from 'react';

interface ProfitabilityItem {
  id: string;
  name: string;
  base_price: number;
  cost: number;
  profit: number;
  profitMargin: number;
  category_id: string;
  menu_categories?: {
    name: string;
    category_type: string;
  };
}

interface TopItem {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ItemProfitabilityTableProps {
  items: ProfitabilityItem[];
  topItems: TopItem[];
  title?: string;
  className?: string;
}

export const ItemProfitabilityTable: React.FC<ItemProfitabilityTableProps> = ({
  items,
  topItems,
  title = 'Item Profitability',
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'profitMargin' | 'profit' | 'revenue'>('profitMargin');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!items || items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No profitability data available</p>
        </div>
      </div>
    );
  }

  // Combine profitability data with sales data
  const enrichedItems = items.map(item => {
    const salesData = topItems.find(topItem => topItem.id === item.id);
    return {
      ...item,
      totalQuantity: salesData?.totalQuantity || 0,
      totalRevenue: salesData?.totalRevenue || 0,
      totalProfit: (salesData?.totalQuantity || 0) * item.profit,
      categoryName: item.menu_categories?.name || 'Unknown'
    };
  });

  // Filter by category
  const filteredItems = filterCategory === 'all'
    ? enrichedItems
    : enrichedItems.filter(item => item.categoryName === filterCategory);

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case 'profit':
        aValue = a.totalProfit;
        bValue = b.totalProfit;
        break;
      case 'revenue':
        aValue = a.totalRevenue;
        bValue = b.totalRevenue;
        break;
      default:
        aValue = a.profitMargin;
        bValue = b.profitMargin;
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  // Get unique categories for filter
  const categories = [...new Set(enrichedItems.map(item => item.categoryName))];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getProfitabilityColor = (margin: number) => {
    if (margin >= 70) return 'text-green-600 bg-green-50';
    if (margin >= 50) return 'text-blue-600 bg-blue-50';
    if (margin >= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProfitabilityBadge = (margin: number) => {
    if (margin >= 70) return { text: 'Excellent', class: 'bg-green-100 text-green-800' };
    if (margin >= 50) return { text: 'Good', class: 'bg-blue-100 text-blue-800' };
    if (margin >= 30) return { text: 'Average', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Poor', class: 'bg-red-100 text-red-800' };
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>

          {/* Filters and Sorting */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="category-filter" className="text-sm text-gray-600">Category:</label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="sort-by" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'profitMargin' | 'profit' | 'revenue')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="profitMargin">Profit Margin</option>
                <option value="profit">Total Profit</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-green-600">High Profit Items</p>
              <p className="text-2xl font-bold text-green-900">
                {sortedItems.filter(item => item.profitMargin >= 70).length}
              </p>
              <p className="text-xs text-green-600">≥70% margin</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600">Good Profit Items</p>
              <p className="text-2xl font-bold text-blue-900">
                {sortedItems.filter(item => item.profitMargin >= 50 && item.profitMargin < 70).length}
              </p>
              <p className="text-xs text-blue-600">50-69% margin</p>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-yellow-600">Average Profit Items</p>
              <p className="text-2xl font-bold text-yellow-900">
                {sortedItems.filter(item => item.profitMargin >= 30 && item.profitMargin < 50).length}
              </p>
              <p className="text-xs text-yellow-600">30-49% margin</p>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-red-600">Low Profit Items</p>
              <p className="text-2xl font-bold text-red-900">
                {sortedItems.filter(item => item.profitMargin < 30).length}
              </p>
              <p className="text-xs text-red-600">&lt;30% margin</p>
            </div>
          </div>
        </div>

        {/* Profitability Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price / Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedItems.map((item, index) => {
                const badge = getProfitabilityBadge(item.profitMargin);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.categoryName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{formatCurrency(item.base_price)} sale</div>
                        <div className="text-gray-500">{formatCurrency(item.cost)} cost</div>
                        <div className="text-green-600 font-medium">{formatCurrency(item.profit)} profit</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getProfitabilityColor(item.profitMargin)}`}>
                        {item.profitMargin.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{item.totalQuantity.toLocaleString()}</div>
                        <div className="text-gray-500">{formatCurrency(item.totalRevenue)} revenue</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Items Analyzed</p>
            <p className="font-bold text-gray-900">{sortedItems.length}</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Profit Margin</p>
            <p className="font-bold text-gray-900">
              {sortedItems.length > 0
                ? (sortedItems.reduce((sum, item) => sum + item.profitMargin, 0) / sortedItems.length).toFixed(1)
                : '0'}%
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Total Profit Generated</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(sortedItems.reduce((sum, item) => sum + item.totalProfit, 0))}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Best Performer</p>
            <p className="font-bold text-gray-900 truncate">
              {sortedItems[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemProfitabilityTable;