// Daily sales summary component
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useDailySales } from '../../hooks/useReports';

export const DailySummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: dailySales, isLoading, error } = useDailySales(selectedDate);

  if (isLoading) {
    return <div className="text-center py-8">Loading daily sales...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading sales data</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Daily Sales - {format(selectedDate, 'MMMM dd, yyyy')}
      </h2>

      {dailySales && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">To-Go Sales</div>
            <div className="text-2xl font-bold text-blue-900">
              {dailySales.togo_sales.toFixed(2)}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600 mb-1">Dine-In Sales</div>
            <div className="text-2xl font-bold text-green-900">
              {dailySales.dine_in_sales.toFixed(2)}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600 mb-1">Gross Sale</div>
            <div className="text-2xl font-bold text-purple-900">
              {dailySales.gross_sale.toFixed(2)}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-600 mb-1">Tax Collected</div>
            <div className="text-2xl font-bold text-yellow-900">
              {dailySales.tax_collected.toFixed(2)}
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-pink-600 mb-1">Gratuity Total</div>
            <div className="text-2xl font-bold text-pink-900">
              {dailySales.gratuity_total.toFixed(2)}
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-indigo-600 mb-1">Net Sale</div>
            <div className="text-2xl font-bold text-indigo-900">
              {dailySales.net_sale.toFixed(2)}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600 mb-1">Credit Total</div>
            <div className="text-2xl font-bold text-red-900">
              {dailySales.credit_total.toFixed(2)}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Cash Deposited</div>
            <div className="text-2xl font-bold text-gray-900">
              {dailySales.cash_deposited.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
