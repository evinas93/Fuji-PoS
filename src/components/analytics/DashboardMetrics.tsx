// Dashboard Metrics Component - Key performance indicators
import React from 'react';

interface DashboardMetricsProps {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  activeOrders: number;
  className?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalSales,
  totalOrders,
  averageTicket,
  activeOrders,
  className = ''
}) => {
  return (
    <div className={className}>
      {/* Main KPI Row - Following PRD format: "Sales: $5,234  Orders: 127  Avg: $41" */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Today's Sales</p>
              <p className="text-2xl font-bold text-green-900">
                ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Average Ticket</p>
              <p className="text-2xl font-bold text-purple-900">
                ${averageTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Active Orders</p>
              <p className="text-2xl font-bold text-orange-900">{activeOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar - Compact view following PRD format */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-center space-x-8 text-center">
          <div>
            <span className="text-gray-600">Sales: </span>
            <span className="font-bold text-gray-900">
              ${totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Orders: </span>
            <span className="font-bold text-gray-900">{totalOrders}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg: </span>
            <span className="font-bold text-gray-900">
              ${Math.round(averageTicket)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Active: </span>
            <span className="font-bold text-orange-600">{activeOrders}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;