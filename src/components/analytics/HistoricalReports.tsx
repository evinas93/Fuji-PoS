// Historical Analytics and Reporting Component
import React, { useState } from 'react';
import { useHistoricalAnalytics, useSalesTrend, useCategoryPerformance, useServerPerformance } from '../../hooks/useAnalytics';
import { SalesChart } from './SalesChart';
import { CategoryAnalysis } from './CategoryAnalysis';
import { ServerAnalysis } from './ServerAnalysis';
import { DateRangePicker } from './DateRangePicker';
import { Button } from '../ui/Button';

interface HistoricalReportsProps {
  className?: string;
}

export const HistoricalReports: React.FC<HistoricalReportsProps> = ({ className = '' }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'categories' | 'servers'>('overview');

  // Fetch data based on date range
  const { data: salesTrend, isLoading: salesLoading, error: salesError } = useSalesTrend(
    Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
  );

  const { data: categoryData, isLoading: categoryLoading } = useCategoryPerformance(dateRange);
  const { data: serverData, isLoading: serverLoading } = useServerPerformance(dateRange);

  const isLoading = salesLoading || categoryLoading || serverLoading;

  const handleExport = () => {
    // Will implement export functionality
    console.log('Export data for date range:', dateRange);
  };

  if (salesError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Report Error</h3>
        <p className="text-red-600 mb-4">
          Unable to load historical data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Date Range Picker */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📈 Historical Reports</h1>
              <p className="text-sm text-gray-500">
                Analytics for {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <DateRangePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onChange={setDateRange}
              />
              <Button onClick={handleExport} variant="secondary" size="sm">
                📊 Export
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-8 border-b">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Sales Overview
            </button>
            <button
              onClick={() => setSelectedTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🏷️ Category Analysis
            </button>
            <button
              onClick={() => setSelectedTab('servers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'servers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Server Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {selectedTab === 'overview' && (
            <SalesChart
              data={salesTrend || []}
              dateRange={dateRange}
              title="Sales Trend Analysis"
            />
          )}

          {selectedTab === 'categories' && (
            <CategoryAnalysis
              data={categoryData || []}
              dateRange={dateRange}
              title="Category Performance"
            />
          )}

          {selectedTab === 'servers' && (
            <ServerAnalysis
              data={serverData || []}
              dateRange={dateRange}
              title="Server Performance"
            />
          )}
        </>
      )}

      {/* Summary Cards */}
      {!isLoading && salesTrend && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ${salesTrend.reduce((sum, day) => sum + (day.gross_sales || day.totalSales || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">
                  {salesTrend.reduce((sum, day) => sum + (day.total_orders || day.orderCount || 0), 0).toLocaleString()}
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
                <p className="text-sm font-medium text-purple-600">Avg Daily Sales</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${salesTrend.length > 0
                    ? Math.round(salesTrend.reduce((sum, day) => sum + (day.gross_sales || day.totalSales || 0), 0) / salesTrend.length).toLocaleString()
                    : '0'}
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
                <p className="text-sm font-medium text-orange-600">Growth Trend</p>
                <p className="text-2xl font-bold text-orange-900">
                  {salesTrend.length > 1 ? (
                    (() => {
                      const firstHalf = salesTrend.slice(0, Math.floor(salesTrend.length / 2));
                      const secondHalf = salesTrend.slice(Math.floor(salesTrend.length / 2));
                      const firstAvg = firstHalf.reduce((sum, day) => sum + (day.gross_sales || day.totalSales || 0), 0) / firstHalf.length;
                      const secondAvg = secondHalf.reduce((sum, day) => sum + (day.gross_sales || day.totalSales || 0), 0) / secondHalf.length;
                      const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
                      return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
                    })()
                  ) : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalReports;