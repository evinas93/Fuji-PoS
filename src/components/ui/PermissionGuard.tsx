// Permission-based component rendering guard
import React from 'react';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePermissions, type Permission } from '../../lib/permissions';

interface PermissionGuardProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires ALL permissions, otherwise requires ANY
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { data: currentUser } = useCurrentUser();
  const permissions = usePermissions(currentUser?.profile?.role);

  if (!currentUser?.profile?.role) {
    return <>{fallback}</>;
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  
  const hasAccess = requireAll
    ? permissions.hasAllPermissions(requiredPermissions)
    : permissions.hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Specialized permission guards for common use cases
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard permission="system.settings" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ManagerOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard permission={["users.manage_roles", "menu.create"]} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const KitchenOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard permission="kitchen.view_orders" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const PaymentAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard permission="payments.process" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Role-based component that shows different content based on user role
interface RoleBasedContentProps {
  admin?: React.ReactNode;
  manager?: React.ReactNode;
  server?: React.ReactNode;
  cashier?: React.ReactNode;
  kitchen?: React.ReactNode;
  viewer?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  admin,
  manager,
  server,
  cashier,
  kitchen,
  viewer,
  fallback = null,
}) => {
  const { data: currentUser } = useCurrentUser();
  const userRole = currentUser?.profile?.role;

  switch (userRole) {
    case 'admin':
      return <>{admin || fallback}</>;
    case 'manager':
      return <>{manager || fallback}</>;
    case 'server':
      return <>{server || fallback}</>;
    case 'cashier':
      return <>{cashier || fallback}</>;
    case 'kitchen':
      return <>{kitchen || fallback}</>;
    case 'viewer':
      return <>{viewer || fallback}</>;
    default:
      return <>{fallback}</>;
  }
};

export default PermissionGuard;
