// Category Analysis Component for Historical Analytics
import React from 'react';

interface CategoryData {
  id: string;
  name: string;
  type?: string;
  totalQuantity: number;
  totalRevenue: number;
  uniqueItems: number;
  averageItemRevenue?: number;
}

interface CategoryAnalysisProps {
  data: CategoryData[];
  dateRange: { start: string; end: string };
  title?: string;
  className?: string;
}

export const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({
  data,
  dateRange,
  title = 'Category Analysis',
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No category data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Sort categories by revenue
  const sortedCategories = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Calculate totals for percentages
  const totalRevenue = sortedCategories.reduce((sum, cat) => sum + cat.totalRevenue, 0);
  const totalQuantity = sortedCategories.reduce((sum, cat) => sum + cat.totalQuantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (type: string | undefined, name: string) => {
    if (type === 'beverage' || name.toLowerCase().includes('wine') || name.toLowerCase().includes('beer')) {
      return '🍷';
    }
    if (type === 'food' || name.toLowerCase().includes('sushi') || name.toLowerCase().includes('tempura')) {
      return '🍱';
    }
    if (name.toLowerCase().includes('sake')) return '🍶';
    if (name.toLowerCase().includes('soft') || name.toLowerCase().includes('drink')) return '🥤';
    return '🍽️';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">
          Performance by category for selected period
        </p>
      </div>

      <div className="p-6">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {sortedCategories.slice(0, 6).map((category, index) => {
            const revenuePercentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
            const quantityPercentage = totalQuantity > 0 ? (category.totalQuantity / totalQuantity) * 100 : 0;

            return (
              <div key={category.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryIcon(category.type, category.name)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-xs text-gray-500">{category.uniqueItems} items</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 ${getCategoryColor(index)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(category.totalRevenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getCategoryColor(index)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${revenuePercentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Quantity: {category.totalQuantity}</span>
                    <span className="text-gray-600">{revenuePercentage.toFixed(1)}% of total</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Distribution Chart */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Revenue Distribution</h4>
          <div className="flex rounded-lg overflow-hidden h-8">
            {sortedCategories.map((category, index) => {
              const percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
              return (
                <div
                  key={category.id}
                  className={`${getCategoryColor(index)} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                  title={`${category.name}: ${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
            {sortedCategories.slice(0, 4).map((category, index) => {
              const percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
              return (
                <div key={category.id} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 ${getCategoryColor(index)} rounded`}></div>
                  <span>{category.name}: {percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg/Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCategories.map((category, index) => {
                const percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
                const avgPerItem = category.uniqueItems > 0 ? category.totalRevenue / category.uniqueItems : 0;

                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(category.type, category.name)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.type || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(category.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.uniqueItems}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(avgPerItem)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`${getCategoryColor(index)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Top Category</p>
            <p className="font-bold text-gray-900 truncate">
              {sortedCategories[0]?.name || 'N/A'}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Categories Active</p>
            <p className="font-bold text-gray-900">
              {sortedCategories.length}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="font-bold text-gray-900">
              {sortedCategories.reduce((sum, cat) => sum + cat.uniqueItems, 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Category Revenue</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(sortedCategories.length > 0 ? totalRevenue / sortedCategories.length : 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysis;