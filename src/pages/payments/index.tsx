import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Layout } from '../../components/layout/Layout';
import { PermissionGuard } from '../../components/ui/PermissionGuard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'cash',
    customerName: '',
    customerPhone: '',
  });

  const handlePaymentMethodChange = (method: string) => {
    setPaymentData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // TODO: Implement payment processing logic
      console.log('Processing payment:', paymentData);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert('Payment processed successfully!');
      setShowPaymentModal(false);
      setPaymentData({
        orderId: '',
        amount: '',
        paymentMethod: 'cash',
        customerName: '',
        customerPhone: '',
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <PermissionGuard allowedRoles={['cashier', 'manager', 'admin']}>
      <Layout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
              <p className="text-gray-600">Process payments and handle transactions</p>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Process Payment
            </Button>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Cash Payments</h3>
                  <p className="text-sm text-gray-600">Today: $0.00</p>
                </div>
                <div className="text-2xl">💵</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Credit Cards</h3>
                  <p className="text-sm text-gray-600">Today: $0.00</p>
                </div>
                <div className="text-2xl">💳</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Refunds</h3>
                  <p className="text-sm text-gray-600">Today: $0.00</p>
                </div>
                <div className="text-2xl">↩️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Total Sales</h3>
                  <p className="text-sm text-gray-600">Today: $0.00</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Transactions</h3>
                <p className="text-gray-600 mb-4">Process your first payment to get started</p>
                <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
                  Process Payment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Processing Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Process Payment"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Order ID"
                value={paymentData.orderId}
                onChange={(e) => setPaymentData((prev) => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order ID"
                required
              />
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                value={paymentData.customerName}
                onChange={(e) =>
                  setPaymentData((prev) => ({ ...prev, customerName: e.target.value }))
                }
                placeholder="Customer name (optional)"
              />
              <Input
                label="Customer Phone"
                value={paymentData.customerPhone}
                onChange={(e) =>
                  setPaymentData((prev) => ({ ...prev, customerPhone: e.target.value }))
                }
                placeholder="Phone number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentData.paymentMethod === 'cash' ? 'primary' : 'secondary'}
                  onClick={() => handlePaymentMethodChange('cash')}
                  className="w-full"
                >
                  Cash
                </Button>
                <Button
                  variant={paymentData.paymentMethod === 'credit' ? 'primary' : 'secondary'}
                  onClick={() => handlePaymentMethodChange('credit')}
                  className="w-full"
                >
                  Credit Card
                </Button>
                <Button
                  variant={paymentData.paymentMethod === 'debit' ? 'primary' : 'secondary'}
                  onClick={() => handlePaymentMethodChange('debit')}
                  className="w-full"
                >
                  Debit Card
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleProcessPayment}
                isLoading={isProcessingPayment}
                disabled={!paymentData.orderId || !paymentData.amount}
              >
                {isProcessingPayment ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </PermissionGuard>
  );
}
