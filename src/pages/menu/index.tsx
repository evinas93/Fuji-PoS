// Menu management page for Fuji POS System - Simplified MVP
import React from 'react';
import { MenuManager } from '../../components/menu';
import { Layout } from '../../components/layout/Layout';

const MenuPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p className="text-gray-600">Add and manage menu items from the Fuji menu</p>
        </div>
        <MenuManager userRole="manager" />
      </div>
    </Layout>
  );
};

export default MenuPage;
