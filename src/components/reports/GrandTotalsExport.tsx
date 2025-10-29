// Grand totals export component
import React from 'react';
import { useAllTimeSales } from '../../hooks/useReports';
import { ExportService } from '../../lib/services/export.service';

const exportService = new ExportService();

export const GrandTotalsExport: React.FC = () => {
  const { data: allTimeSales, isLoading, error } = useAllTimeSales();

  const handleExport = () => {
    if (allTimeSales && allTimeSales.length > 0) {
      exportService.exportGrandTotals(allTimeSales);
    }
  };

  // Calculate overall grand totals
  const grandTotals = allTimeSales?.reduce(
    (acc, month) => ({
      togo_sales: acc.togo_sales + month.totals.togo_sales,
      dine_in_sales: acc.dine_in_sales + month.totals.dine_in_sales,
      tax_collected: acc.tax_collected + month.totals.tax_collected,
      gross_sale: acc.gross_sale + month.totals.gross_sale,
      gratuity_total: acc.gratuity_total + month.totals.gratuity_total,
      net_sale: acc.net_sale + month.totals.net_sale,
      credit_total: acc.credit_total + month.totals.credit_total,
      cash_deposited: acc.cash_deposited + month.totals.cash_deposited,
    }),
    {
      togo_sales: 0,
      dine_in_sales: 0,
      tax_collected: 0,
      gross_sale: 0,
      gratuity_total: 0,
      net_sale: 0,
      credit_total: 0,
      cash_deposited: 0,
    }
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Grand Totals Sales Summary</h2>

      {isLoading && (
        <div className="text-center py-8 text-gray-600">Loading all-time sales data...</div>
      )}

      {error && <div className="text-center py-8 text-red-600">Error loading sales data</div>}

      {allTimeSales && allTimeSales.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Totals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">To-Go Sales</div>
                <div className="text-2xl font-bold text-blue-900">
                  {grandTotals?.togo_sales.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Dine-In Sales</div>
                <div className="text-2xl font-bold text-green-900">
                  {grandTotals?.dine_in_sales.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gross Sale</div>
                <div className="text-2xl font-bold text-purple-900">
                  {grandTotals?.gross_sale.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Net Sale</div>
                <div className="text-2xl font-bold text-indigo-900">
                  {grandTotals?.net_sale.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Monthly Breakdown</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allTimeSales.map((month, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 px-3 bg-white rounded"
                >
                  <div className="font-medium text-gray-900">
                    {month.month} {month.year}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Net Sale</div>
                    <div className="font-bold text-gray-900">
                      {month.totals.net_sale.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Export Grand Totals to Excel
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              File will be saved as: <strong>Grand_Totals_Sales_Summary.xlsx</strong>
            </p>
            <p className="mt-1">Includes monthly breakdown and grand total across all time</p>
          </div>
        </div>
      )}

      {allTimeSales && allTimeSales.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No sales data available yet. Complete some orders to see reports.
        </div>
      )}
    </div>
  );
};
