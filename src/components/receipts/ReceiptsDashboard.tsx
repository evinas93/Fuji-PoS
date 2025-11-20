// Receipts dashboard component for viewing and managing past receipts
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { PermissionGuard } from '../ui/PermissionGuard';
import ReceiptModal from './ReceiptModal';
import OrderEditModal from '../orders/OrderEditModal';
import VoidOrderModal from '../orders/VoidOrderModal';
import { receiptService, ReceiptData } from '../../lib/services/receipt.service';

interface ReceiptsResponse {
  success: boolean;
  data: ReceiptData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const ReceiptsDashboard: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number>(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderType, setOrderType] = useState<'all' | 'dine_in' | 'take_out'>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceipts, setTotalReceipts] = useState(0);

  useEffect(() => {
    loadReceipts();
  }, [currentPage, startDate, endDate, orderNumber, orderType, paymentMethod]);

  const loadReceipts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(orderNumber && { orderNumber }),
        ...(orderType !== 'all' && { orderType }),
        ...(paymentMethod && { paymentMethod }),
      });

      const response = await fetch(`/api/receipts?${params.toString()}`);
      const result: ReceiptsResponse = await response.json();

      if (result.success) {
        setReceipts(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalReceipts(result.pagination.total);
      } else {
        setError('Failed to load receipts');
      }
    } catch (err) {
      setError('Error loading receipts');
      console.error('Error loading receipts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = (receiptId: string) => {
    receiptService.printReceipt(receiptId);
  };

  const handleEditOrder = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setShowEditModal(true);
  };

  const handleVoidOrder = (receiptId: string, orderNumber: number) => {
    setSelectedReceiptId(receiptId);
    setSelectedOrderNumber(orderNumber);
    setShowVoidModal(true);
  };

  const handleOrderUpdated = () => {
    loadReceipts(); // Reload the list
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setOrderNumber('');
    setOrderType('all');
    setPaymentMethod('');
    setCurrentPage(1);
  };

  const fmt = (n: number | undefined) => {
    return typeof n === 'number' ? n.toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Receipts</div>
          <div className="text-2xl font-bold text-gray-900">{totalReceipts}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Current Page</div>
          <div className="text-2xl font-bold text-gray-900">
            {currentPage} of {totalPages}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Showing</div>
          <div className="text-2xl font-bold text-gray-900">{receipts.length} receipts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Order Number Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input
              type="text"
              placeholder="Search by order #"
              value={orderNumber}
              onChange={(e) => {
                setOrderNumber(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => {
                setOrderType(e.target.value as 'all' | 'dine_in' | 'take_out');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="dine_in">Dine In</option>
              <option value="take_out">Take Out</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="gift_card">Gift Card</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button variant="secondary" onClick={handleClearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading receipts...</p>
        </div>
      )}

      {/* Receipts Table */}
      {!isLoading && receipts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{receipt.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(receipt.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {receipt.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {receipt.restaurant_tables ? `Table ${receipt.restaurant_tables.table_number}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${fmt(receipt.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {receipt.payment_method || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewReceipt(receipt.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePrintReceipt(receipt.id)}
                      >
                        Print
                      </Button>
                      <PermissionGuard allowedRoles={['manager', 'admin']}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditOrder(receipt.id)}
                        >
                          Edit
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard allowedRoles={['manager', 'admin']}>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleVoidOrder(receipt.id, receipt.order_number)}
                        >
                          Void
                        </Button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {!isLoading && receipts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No receipts found matching your filters.</p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-lg shadow">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptId(null);
          }}
          orderId={selectedReceiptId}
        />
      )}

      {/* Edit Order Modal */}
      {selectedReceiptId && (
        <OrderEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReceiptId(null);
          }}
          orderId={selectedReceiptId}
          onSave={handleOrderUpdated}
        />
      )}

      {/* Void Order Modal */}
      {selectedReceiptId && (
        <VoidOrderModal
          isOpen={showVoidModal}
          onClose={() => {
            setShowVoidModal(false);
            setSelectedReceiptId(null);
          }}
          orderId={selectedReceiptId}
          orderNumber={selectedOrderNumber}
          onVoid={handleOrderUpdated}
        />
      )}
    </div>
  );
};

export default ReceiptsDashboard;
