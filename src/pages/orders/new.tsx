// Simplified order entry page for MVP
import React from 'react';
import { Layout } from '../../components/layout/Layout';
import { SimpleOrderForm } from '../../components/orders/SimpleOrderForm';

const NewOrderPage: React.FC = () => {
  const handleOrderCompleted = () => {
    // Order completed successfully - can be extended for notifications or navigation
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Order</h1>
          <p className="text-gray-600">
            Select menu items, choose order type and payment method, then complete the order
          </p>
        </div>

        <SimpleOrderForm onOrderCompleted={handleOrderCompleted} />
      </div>
    </Layout>
  );
};

export default NewOrderPage;
