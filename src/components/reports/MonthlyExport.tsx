// Monthly export component
import React, { useState } from 'react';
import { useMonthlySales } from '../../hooks/useReports';
import { ExportService } from '../../lib/services/export.service';

const exportService = new ExportService();

export const MonthlyExport: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: monthlyData, isLoading, error } = useMonthlySales(selectedYear, selectedMonth);

  const handleExportExcel = () => {
    if (monthlyData) {
      exportService.exportMonthlyReport(monthlyData);
    }
  };

  const handleExportCSV = () => {
    if (monthlyData) {
      exportService.exportMonthlyCSV(monthlyData);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Sales Export</h2>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-600">Loading monthly data...</div>}

      {error && <div className="text-center py-8 text-red-600">Error loading monthly data</div>}

      {monthlyData && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">To-Go Sales</div>
                <div className="text-xl font-bold text-gray-900">
                  {monthlyData.totals.togo_sales.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Dine-In Sales</div>
                <div className="text-xl font-bold text-gray-900">
                  {monthlyData.totals.dine_in_sales.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gross Sale</div>
                <div className="text-xl font-bold text-gray-900">
                  {monthlyData.totals.gross_sale.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Net Sale</div>
                <div className="text-xl font-bold text-gray-900">
                  {monthlyData.totals.net_sale.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleExportExcel}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Export to Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export to CSV
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              File will be saved as:{' '}
              <strong>
                {monthlyData.month}_{selectedYear}_SALES.xlsx
              </strong>
            </p>
            <p className="mt-1">Format matches Month_Year_SALES structure (without $ signs)</p>
          </div>
        </div>
      )}
    </div>
  );
};
