// Real-time Analytics Dashboard Component
import React from 'react';
import { useRealtimeAnalytics } from '../../hooks/useAnalytics';
import { DashboardMetrics } from './DashboardMetrics';
import { SalesTrendChart } from './SalesTrendChart';
import { TopItemsList } from './TopItemsList';
import { ServerPerformance } from './ServerPerformance';
import { PaymentBreakdown } from './PaymentBreakdown';
import { Button } from '../ui/Button';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useRealtimeAnalytics();

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Dashboard Error</h3>
        <p className="text-red-600 mb-4">
          Unable to load analytics data. Please check your connection and try again.
        </p>
        <Button onClick={() => refetch()} variant="secondary" size="sm">
          Retry
        </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">📊 Daily Sales Dashboard</h1>
              <p className="text-sm text-gray-500">
                Real-time analytics for {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Button onClick={() => refetch()} variant="secondary" size="sm">
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics - Following PRD layout: "Sales: $5,234 Orders: 127 Avg: $41" */}
        <DashboardMetrics
          totalSales={analytics?.totalSales || 0}
          totalOrders={analytics?.totalOrders || 0}
          averageTicket={analytics?.averageTicket || 0}
          activeOrders={analytics?.activeOrders || 0}
          className="p-6"
        />
      </div>

      {/* Sales Trend Chart - Following PRD layout: "Sales Trend: [████████████████████──]" */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">📈 Hourly Sales Trend</h2>
        </div>
        <div className="p-6">
          <SalesTrendChart data={analytics?.hourlySales || []} />
        </div>
      </div>

      {/* Bottom Row - Following PRD layout: "Top Items | Server Stats" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items - Following PRD: "1. Cal Roll (45)" */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">🏆 Top Selling Items</h2>
          </div>
          <div className="p-6">
            <TopItemsList items={analytics?.topItems || []} />
          </div>
        </div>

        {/* Server Stats - Following PRD: "John: $1,234" */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">👥 Server Performance</h2>
          </div>
          <div className="p-6">
            <ServerPerformance servers={analytics?.serverStats || []} />
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">💳 Payment Methods</h2>
        </div>
        <div className="p-6">
          <PaymentBreakdown data={analytics?.paymentBreakdown || []} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;