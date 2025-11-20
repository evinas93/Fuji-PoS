// Void order modal component for voiding orders with reason (Manager only)
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface VoidOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: number;
  onVoid?: () => void;
}

export const VoidOrderModal: React.FC<VoidOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onVoid,
}) => {
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      setError('Please provide a reason for voiding this order');
      return;
    }

    setIsVoiding(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update order as voided
      const { error: voidError } = await supabase
        .from('orders')
        .update({
          is_void: true,
          void_reason: voidReason,
          void_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (voidError) throw voidError;

      // Log the void action to audit log
      await supabase.from('audit_log').insert({
        table_name: 'orders',
        record_id: orderId,
        action: 'UPDATE',
        new_values: {
          is_void: true,
          void_reason: voidReason,
          action_type: 'VOID',
        },
        changed_by: user.id,
      });

      onVoid?.();
      onClose();
      setVoidReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to void order');
      console.error('Error voiding order:', err);
    } finally {
      setIsVoiding(false);
    }
  };

  const handleClose = () => {
    setVoidReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Void Order #${orderNumber}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Warning:</p>
          <p className="text-sm">
            This action will mark the order as void. This cannot be undone. The order will be
            excluded from sales reports and totals.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Void Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Voiding (Required)
          </label>
          <textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Explain why this order is being voided..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleVoid}
            disabled={isVoiding || !voidReason.trim()}
            isLoading={isVoiding}
            className="flex-1"
          >
            {isVoiding ? 'Voiding...' : 'Void Order'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          This action will be logged in the audit trail.
        </p>
      </div>
    </Modal>
  );
};

export default VoidOrderModal;
