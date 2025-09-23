import React, { useState, useEffect } from 'react';
import { useTransferOrder } from '../../hooks/useOrders';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface OrderTransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: number;
    order_type: string;
    restaurant_tables?: {
      table_number: number;
      section?: string;
    };
  };
  availableTables: Array<{
    id: string;
    table_number: number;
    section?: string;
    seats: number;
    is_occupied: boolean;
  }>;
  onOrderTransferred?: () => void;
}

export default function OrderTransferForm({
  isOpen,
  onClose,
  order,
  availableTables,
  onOrderTransferred
}: OrderTransferFormProps) {
  const transferOrder = useTransferOrder();
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTableId('');
      setReason('');
    }
  }, [isOpen]);

  const handleTransfer = async () => {
    if (!selectedTableId) return;

    try {
      await transferOrder.mutateAsync({
        orderId: order.id,
        newTableId: selectedTableId
      });
      onOrderTransferred?.();
      onClose();
    } catch (error) {
      console.error('Error transferring order:', error);
    }
  };

  const formatTableInfo = (table: any) => {
    const section = table.section ? ` (${table.section})` : '';
    return `Table ${table.table_number}${section} - ${table.seats} seats`;
  };

  const availableTablesForTransfer = availableTables.filter(table => 
    !table.is_occupied || table.id === order.restaurant_tables?.id
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Order" size="md">
      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Transfer Order #{order.order_number} to a different table
          </p>
          {order.restaurant_tables && (
            <p className="text-sm text-gray-500">
              Current table: {order.restaurant_tables.table_number}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Table
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {availableTablesForTransfer.map((table) => (
                <label
                  key={table.id}
                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                    selectedTableId === table.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="table"
                    value={table.id}
                    checked={selectedTableId === table.id}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {formatTableInfo(table)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        table.is_occupied 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {table.is_occupied ? 'Occupied' : 'Available'}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Transfer (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for transferring this order..."
              className="w-full p-3 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTransfer}
            disabled={!selectedTableId || transferOrder.isPending}
          >
            {transferOrder.isPending ? 'Transferring...' : 'Transfer Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

