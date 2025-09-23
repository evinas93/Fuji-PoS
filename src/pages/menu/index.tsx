// Menu management page for Fuji POS System
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MenuManager } from '../../components/menu';
import { PermissionGuard } from '../../components/ui/PermissionGuard';
import { Layout } from '../../components/layout/Layout';

const MenuPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <PermissionGuard 
        allowedRoles={['admin', 'manager', 'server']}
        fallback={
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access the menu management system.
            </p>
          </div>
        }
      >
        <MenuManager userRole={user?.role || 'server'} />
      </PermissionGuard>
    </Layout>
  );
};

export default MenuPage;
