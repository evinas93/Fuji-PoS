// Product Performance Analytics Component
import React, { useState } from 'react';
import { useTopSellingItems, useItemProfitability, useCategoryPerformance } from '../../hooks/useAnalytics';
import { ItemProfitabilityTable } from './ItemProfitabilityTable';
import { MenuOptimizationInsights } from './MenuOptimizationInsights';
import { PerformanceMetrics } from './PerformanceMetrics';
import { DateRangePicker } from './DateRangePicker';
import { Button } from '../ui/Button';

interface ProductPerformanceProps {
  className?: string;
}

export const ProductPerformance: React.FC<ProductPerformanceProps> = ({ className = '' }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [selectedView, setSelectedView] = useState<'profitability' | 'performance' | 'optimization'>('profitability');

  // Fetch data
  const { data: topItems, isLoading: topItemsLoading, error: topItemsError } = useTopSellingItems(20);
  const { data: profitabilityData, isLoading: profitabilityLoading } = useItemProfitability();
  const { data: categoryData, isLoading: categoryLoading } = useCategoryPerformance(dateRange);

  const isLoading = topItemsLoading || profitabilityLoading || categoryLoading;

  if (topItemsError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Data Error</h3>
        <p className="text-red-600 mb-4">
          Unable to load product performance data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍱 Product Performance</h1>
              <p className="text-sm text-gray-500">
                Menu item analytics and profitability analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <DateRangePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onChange={setDateRange}
              />
              <Button variant="secondary" size="sm">
                📊 Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-8 border-b">
            <button
              onClick={() => setSelectedView('profitability')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'profitability'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Item Profitability
            </button>
            <button
              onClick={() => setSelectedView('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'performance'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📈 Performance Metrics
            </button>
            <button
              onClick={() => setSelectedView('optimization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'optimization'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🤖 Menu Optimization
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {selectedView === 'profitability' && (
            <ItemProfitabilityTable
              items={profitabilityData || []}
              topItems={topItems || []}
              title="Item Profitability Analysis"
            />
          )}

          {selectedView === 'performance' && (
            <PerformanceMetrics
              topItems={topItems || []}
              categoryData={categoryData || []}
              dateRange={dateRange}
              title="Performance Metrics"
            />
          )}

          {selectedView === 'optimization' && (
            <MenuOptimizationInsights
              profitabilityData={profitabilityData || []}
              topItems={topItems || []}
              categoryData={categoryData || []}
              title="Menu Optimization Insights"
            />
          )}
        </>
      )}

      {/* Quick Summary Cards */}
      {!isLoading && topItems && profitabilityData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Best Seller</p>
                <p className="text-lg font-bold text-green-900 truncate">
                  {topItems[0]?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {topItems[0]?.totalQuantity} sold
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Most Profitable</p>
                <p className="text-lg font-bold text-blue-900 truncate">
                  {profitabilityData[0]?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {profitabilityData[0]?.profitMargin.toFixed(1)}% margin
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Items</p>
                <p className="text-2xl font-bold text-purple-900">
                  {profitabilityData?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Profit Margin</p>
                <p className="text-2xl font-bold text-orange-900">
                  {profitabilityData && profitabilityData.length > 0
                    ? (profitabilityData.reduce((sum, item) => sum + item.profitMargin, 0) / profitabilityData.length).toFixed(1)
                    : '0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPerformance;