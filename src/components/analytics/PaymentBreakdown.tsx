// Payment Methods Breakdown Component
import React from 'react';

interface PaymentMethod {
  method: 'cash' | 'credit' | 'debit';
  count: number;
  totalAmount: number;
  percentage?: number;
}

interface PaymentBreakdownProps {
  data: PaymentMethod[];
  className?: string;
}

export const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  data,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No payment data available</p>
      </div>
    );
  }

  const totalAmount = data.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const totalTransactions = data.reduce((sum, payment) => sum + payment.count, 0);

  // Calculate percentages
  const paymentData = data.map(payment => ({
    ...payment,
    percentage: totalAmount > 0 ? (payment.totalAmount / totalAmount) * 100 : 0
  }));

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'credit': return '💳';
      case 'debit': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-500';
      case 'credit': return 'bg-blue-500';
      case 'debit': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={className}>
      {/* Payment Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {paymentData.map((payment) => (
          <div key={payment.method} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getPaymentIcon(payment.method)}</span>
                <span className="font-medium text-gray-900 capitalize">{payment.method}</span>
              </div>
              <span className="text-sm text-gray-500">
                {payment.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">
                  ${payment.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions:</span>
                <span className="font-bold text-gray-900">{payment.count}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className={`${getPaymentColor(payment.method)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${payment.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Chart */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-3">Payment Distribution</h4>
        <div className="flex rounded-lg overflow-hidden h-6">
          {paymentData.map((payment) => (
            <div
              key={payment.method}
              className={`${getPaymentColor(payment.method)} transition-all duration-300`}
              style={{ width: `${payment.percentage}%` }}
              title={`${payment.method}: ${payment.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {paymentData.map((payment) => (
            <span key={payment.method} className="capitalize">
              {payment.method}: {payment.percentage.toFixed(0)}%
            </span>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="font-bold text-gray-900">
            ${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Transactions</p>
          <p className="font-bold text-gray-900">{totalTransactions}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Transaction</p>
          <p className="font-bold text-gray-900">
            ${totalTransactions > 0
              ? Math.round(totalAmount / totalTransactions)
              : 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Primary Method</p>
          <p className="font-bold text-gray-900 capitalize">
            {paymentData.length > 0
              ? paymentData.reduce((max, payment) =>
                  payment.totalAmount > max.totalAmount ? payment : max
                ).method
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentBreakdown;