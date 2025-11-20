// Receipt modal component for displaying order receipts
import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { receiptService, ReceiptData } from '../../lib/services/receipt.service';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadReceipt();
    }
  }, [isOpen, orderId]);

  const loadReceipt = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/receipt?format=json`);
      const result = await response.json();

      if (result.success && result.data) {
        setReceipt(result.data);
      } else {
        setError('Failed to load receipt');
      }
    } catch (err) {
      setError('Error loading receipt');
      console.error('Error loading receipt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    receiptService.printReceipt(orderId);
  };

  const fmt = (n: number | undefined) => {
    return typeof n === 'number' ? n.toFixed(2) : '0.00';
  };

  if (!receipt && !isLoading && !error) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receipt #${receipt?.order_number || ''}`}
      size="lg"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading receipt...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {receipt && !isLoading && (
          <>
            {/* Header Info */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Fuji Restaurant</h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Order #{receipt.order_number}</p>
                <p>
                  {receipt.order_type === 'dine_in' ? 'Dine In' : 'Take Out'}
                  {receipt.restaurant_tables && ` • Table ${receipt.restaurant_tables.table_number}`}
                </p>
                {receipt.users && <p>Server: {receipt.users.full_name}</p>}
                <p>{new Date(receipt.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Items */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
              <div className="space-y-3">
                {receipt.order_items && receipt.order_items.length > 0 ? (
                  receipt.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.quantity}x {item.item_name}
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.modifiers.map((m: any) => m.name).join(', ')}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            Note: {item.special_instructions}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          ${fmt(item.unit_price)} each
                        </div>
                      </div>
                      <div className="font-medium text-gray-900 ml-4">
                        ${fmt(item.total_price)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No items</p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${fmt(receipt.subtotal)}</span>
              </div>

              {receipt.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">-${fmt(receipt.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="text-gray-900">${fmt(receipt.tax_amount)}</span>
              </div>

              {receipt.gratuity_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gratuity (20%)</span>
                  <span className="text-gray-900">${fmt(receipt.gratuity_amount)}</span>
                </div>
              )}

              {receipt.service_charge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Charge</span>
                  <span className="text-gray-900">${fmt(receipt.service_charge)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${fmt(receipt.total_amount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              Thank you for dining with us!
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handlePrint}
                className="flex-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptModal;
