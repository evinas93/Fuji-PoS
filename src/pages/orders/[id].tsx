import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useOrder, useUpdateOrderStatus, useSendToKitchen, useCancelOrder } from '../../hooks/useOrders';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { PermissionGuard } from '../../components/ui/PermissionGuard';
import { Modal } from '../../components/ui/Modal';
import OrderTimeline from '../../components/orders/OrderTimeline';
import OrderModificationForm from '../../components/orders/OrderModificationForm';
import OrderTransferForm from '../../components/orders/OrderTransferForm';
import OrderSplitForm from '../../components/orders/OrderSplitForm';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { data: order, isLoading, error } = useOrder(id as string);
  const updateOrderStatus = useUpdateOrderStatus();
  const sendToKitchen = useSendToKitchen();
  const cancelOrder = useCancelOrder();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading order: {error?.message || 'Order not found'}</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSendToKitchen = async () => {
    try {
      await sendToKitchen.mutateAsync(order.id);
    } catch (error) {
      console.error('Error sending to kitchen:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: status as any,
        options: status === 'completed' ? { completed_by: user?.id } : {}
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;

    try {
      await cancelOrder.mutateAsync({
        orderId: order.id,
        reason: cancelReason,
        cancelledBy: user?.id || ''
      });
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOrderType = (type: string) => {
    return type === 'dine_in' ? 'Dine In' : 'Take Out';
  };

  const formatTableInfo = () => {
    if (order.order_type === 'take_out') {
      return order.customer_name ? `Customer: ${order.customer_name}` : 'Take Out';
    }
    
    if (order.restaurant_tables) {
      return `Table ${order.restaurant_tables.table_number}`;
    }
    
    return 'No table assigned';
  };

  const canSendToKitchen = order.status === 'pending' && order.order_items?.length > 0;
  const canMarkReady = order.status === 'preparing';
  const canMarkCompleted = order.status === 'ready';

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.order_number}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600">
              {formatOrderType(order.order_type)} • {formatTableInfo()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <PermissionGuard allowedRoles={['server', 'manager']}>
                <Button
                  variant="secondary"
                  onClick={() => setShowModifyModal(true)}
                >
                  Modify Order
                </Button>
              </PermissionGuard>
            )}

            {order.status === 'pending' && (
              <PermissionGuard allowedRoles={['server', 'manager']}>
                <Button
                  variant="secondary"
                  onClick={() => setShowTransferModal(true)}
                >
                  Transfer Order
                </Button>
              </PermissionGuard>
            )}

            {order.status === 'pending' && order.order_items && order.order_items.length > 1 && (
              <PermissionGuard allowedRoles={['server', 'manager']}>
                <Button
                  variant="secondary"
                  onClick={() => setShowSplitModal(true)}
                >
                  Split Order
                </Button>
              </PermissionGuard>
            )}

            {canSendToKitchen && (
              <PermissionGuard allowedRoles={['server', 'manager']}>
                <Button
                  variant="primary"
                  onClick={handleSendToKitchen}
                  disabled={sendToKitchen.isPending}
                >
                  {sendToKitchen.isPending ? 'Sending...' : 'Send to Kitchen'}
                </Button>
              </PermissionGuard>
            )}

            {canMarkReady && (
              <PermissionGuard allowedRoles={['kitchen', 'manager']}>
                <Button
                  variant="primary"
                  onClick={() => handleUpdateStatus('ready')}
                  disabled={updateOrderStatus.isPending}
                >
                  Mark Ready
                </Button>
              </PermissionGuard>
            )}

            {canMarkCompleted && (
              <PermissionGuard allowedRoles={['server', 'manager', 'cashier']}>
                <Button
                  variant="primary"
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={updateOrderStatus.isPending}
                >
                  Mark Completed
                </Button>
              </PermissionGuard>
            )}

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <PermissionGuard allowedRoles={['manager']}>
                <Button
                  variant="danger"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Order
                </Button>
              </PermissionGuard>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Type</label>
                  <p className="text-sm text-gray-900">{formatOrderType(order.order_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Server</label>
                  <p className="text-sm text-gray-900">{order.users?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700">Order Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <OrderItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <OrderTimeline order={order} />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                {order.gratuity_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Gratuity:</span>
                    <span>${order.gratuity_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.service_charge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Service Charge:</span>
                    <span>${order.service_charge.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {order.payments && order.payments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Payments</h3>
                  <div className="space-y-2">
                    {order.payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="capitalize">{payment.payment_method}</span>
                        <span>${payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Modification Modal */}
        <OrderModificationForm
          isOpen={showModifyModal}
          onClose={() => setShowModifyModal(false)}
          order={order}
          onOrderUpdated={() => {
            // Refresh order data
            window.location.reload();
          }}
        />

        {/* Order Transfer Modal */}
        <OrderTransferForm
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          order={order}
          availableTables={[]} // TODO: Fetch available tables
          onOrderTransferred={() => {
            // Refresh order data
            window.location.reload();
          }}
        />

        {/* Order Split Modal */}
        <OrderSplitForm
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          order={order}
          availableTables={[]} // TODO: Fetch available tables
          onOrderSplit={() => {
            // Navigate back to orders list
            router.push('/orders');
          }}
        />

        {/* Cancel Order Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Order"
        >
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || cancelOrder.isPending}
              >
                {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

// Order Item Card Component
function OrderItemCard({ item }: { item: any }) {
  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.item_name}</h4>
          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </div>

      {item.modifiers && item.modifiers.length > 0 && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">Modifiers:</p>
          <div className="text-sm text-gray-700">
            {item.modifiers.map((mod: any, index: number) => (
              <span key={index}>
                {mod.name} {mod.price > 0 && `(+$${mod.price.toFixed(2)})`}
                {index < item.modifiers.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.special_instructions && (
        <div className="mb-2">
          <p className="text-sm text-gray-600">Special Instructions:</p>
          <p className="text-sm text-gray-700 italic">"{item.special_instructions}"</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Unit Price: ${item.unit_price.toFixed(2)}
        </div>
        <div className="font-semibold text-gray-900">
          ${item.total_price.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
