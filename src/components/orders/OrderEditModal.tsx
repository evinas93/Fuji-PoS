// Order edit modal component for editing completed orders (Manager only)
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSave?: () => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSave,
}) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [editReason, setEditReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderItems();
    }
  }, [isOpen, orderId]);

  const loadOrderItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (fetchError) throw fetchError;

      setOrderItems(data as OrderItem[]);
    } catch (err: any) {
      setError('Failed to load order items');
      console.error('Error loading order items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setOrderItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const newTotalPrice = item.unit_price * newQuantity;
          return { ...item, quantity: newQuantity, total_price: newTotalPrice };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;

    setOrderItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          const newTotalPrice = newPrice * item.quantity;
          return { ...item, unit_price: newPrice, total_price: newTotalPrice };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((items) => items.filter((item) => item.id !== itemId));
  };

  const handleSave = async () => {
    if (!editReason.trim()) {
      setError('Please provide a reason for editing this order');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update each order item
      for (const item of orderItems) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      // Log the edit to audit log
      await supabase.from('audit_log').insert({
        table_name: 'orders',
        record_id: orderId,
        action: 'UPDATE',
        new_values: {
          reason: editReason,
          edited_items: orderItems.map(i => ({
            id: i.id,
            quantity: i.quantity,
            unit_price: i.unit_price
          }))
        },
        changed_by: user.id,
      });

      // Trigger order totals recalculation
      await supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);

      onSave?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
      console.error('Error saving order edits:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Order (Manager Only)"
      size="xl"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading order items...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!isLoading && (
          <>
            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p className="font-semibold">Warning:</p>
              <p className="text-sm">
                Editing completed orders will be logged and require a reason. All changes are
                tracked in the audit log.
              </p>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.item_name}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Qty:</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value, 10) || 0)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Price:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          handlePriceChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>

                    <div className="font-semibold text-gray-900 w-24 text-right">
                      ${item.total_price.toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-800 font-bold text-lg"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>New Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Edit Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Editing (Required)
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Explain why this order is being modified..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving || !editReason.trim() || orderItems.length === 0}
                isLoading={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default OrderEditModal;
