// Sales Trend Chart Component - Hourly sales visualization
import React from 'react';

interface HourlySales {
  hour: number;
  sales: number;
  orders: number;
}

interface SalesTrendChartProps {
  data: HourlySales[];
  className?: string;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No sales data available for today</p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxSales = Math.max(...data.map(d => d.sales), 1);

  // Get current hour to highlight
  const currentHour = new Date().getHours();

  return (
    <div className={className}>
      {/* Bar Chart - Following PRD format: "Sales Trend: [████████████████████──]" */}
      <div className="space-y-2 mb-4">
        {data.map((hourData) => {
          const barWidth = maxSales > 0 ? (hourData.sales / maxSales) * 100 : 0;
          const isCurrentHour = hourData.hour === currentHour;

          return (
            <div key={hourData.hour} className="flex items-center space-x-3">
              {/* Hour Label */}
              <div className="w-12 text-sm text-gray-600 text-right">
                {hourData.hour.toString().padStart(2, '0')}:00
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCurrentHour
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-2 ring-blue-300'
                      : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />

                {/* Sales Amount Overlay */}
                {hourData.sales > 0 && (
                  <div className="absolute inset-0 flex items-center justify-start pl-2">
                    <span className="text-xs font-medium text-white">
                      ${hourData.sales.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Orders Count */}
              <div className="w-16 text-sm text-gray-600 text-center">
                {hourData.orders} orders
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Peak Hour</p>
          <p className="font-bold text-gray-900">
            {data.reduce((peak, hour) => hour.sales > peak.sales ? hour : peak, data[0])?.hour || 0}:00
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Peak Sales</p>
          <p className="font-bold text-gray-900">
            ${Math.max(...data.map(d => d.sales)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Total Hours Active</p>
          <p className="font-bold text-gray-900">
            {data.filter(d => d.orders > 0).length}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Current Hour</p>
          <p className="font-bold text-blue-600">
            {currentHour.toString().padStart(2, '0')}:00
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesTrendChart;