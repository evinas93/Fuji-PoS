// Sales Chart Component for Historical Data
import React from 'react';

interface SalesData {
  sales_date?: string;
  date?: string;
  gross_sales?: number;
  totalSales?: number;
  net_sales?: number;
  total_orders?: number;
  orderCount?: number;
  dine_in_sales?: number;
  take_out_sales?: number;
}

interface SalesChartProps {
  data: SalesData[];
  dateRange: { start: string; end: string };
  title?: string;
  className?: string;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  dateRange,
  title = 'Sales Chart',
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No sales data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Calculate max values for scaling
  const maxSales = Math.max(...data.map(d => d.gross_sales || d.totalSales || 0));
  const maxOrders = Math.max(...data.map(d => d.total_orders || d.orderCount || 0));

  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.sales_date || a.date || '').getTime();
    const dateB = new Date(b.sales_date || b.date || '').getTime();
    return dateA - dateB;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </p>
      </div>

      <div className="p-6">
        {/* Chart Area */}
        <div className="space-y-4 mb-6">
          {sortedData.map((dayData, index) => {
            const sales = dayData.gross_sales || dayData.totalSales || 0;
            const orders = dayData.total_orders || dayData.orderCount || 0;
            const date = dayData.sales_date || dayData.date || '';

            const salesWidth = maxSales > 0 ? (sales / maxSales) * 100 : 0;
            const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;

            return (
              <div key={index} className="flex items-center space-x-4">
                {/* Date */}
                <div className="w-16 text-sm text-gray-600 text-right">
                  {formatDate(date)}
                </div>

                {/* Sales Bar */}
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isWeekend
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${salesWidth}%` }}
                  />

                  {/* Sales Amount Overlay */}
                  <div className="absolute inset-0 flex items-center justify-start pl-3">
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(sales)}
                    </span>
                  </div>

                  {/* Orders Badge */}
                  {orders > 0 && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border">
                        {orders} orders
                      </span>
                    </div>
                  )}
                </div>

                {/* Average Ticket */}
                <div className="w-16 text-sm text-gray-600 text-center">
                  ${orders > 0 ? Math.round(sales / orders) : 0}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">Weekday Sales</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded"></div>
            <span className="text-sm text-gray-600">Weekend Sales</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Highest Day</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(maxSales)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Average Daily</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(data.length > 0
                ? data.reduce((sum, d) => sum + (d.gross_sales || d.totalSales || 0), 0) / data.length
                : 0
              )}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="font-bold text-gray-900">
              {data.reduce((sum, d) => sum + (d.total_orders || d.orderCount || 0), 0).toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Ticket</p>
            <p className="font-bold text-gray-900">
              {(() => {
                const totalSales = data.reduce((sum, d) => sum + (d.gross_sales || d.totalSales || 0), 0);
                const totalOrders = data.reduce((sum, d) => sum + (d.total_orders || d.orderCount || 0), 0);
                return formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0);
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;