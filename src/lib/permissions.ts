// Role-based permissions and access control utilities
import React from 'react';
import type { UserRole } from '../types/database';

// Define all possible permissions in the system
export type Permission = 
  // User Management
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'users.manage_roles'
  | 'users.view_all'
  
  // Menu Management
  | 'menu.create'
  | 'menu.read'
  | 'menu.update'
  | 'menu.delete'
  | 'menu.manage_categories'
  | 'menu.toggle_availability'
  | 'menu.update_pricing'
  
  // Order Management
  | 'orders.create'
  | 'orders.read'
  | 'orders.update'
  | 'orders.delete'
  | 'orders.void'
  | 'orders.transfer'
  | 'orders.split'
  | 'orders.view_all'
  
  // Kitchen Operations
  | 'kitchen.view_orders'
  | 'kitchen.update_status'
  | 'kitchen.mark_ready'
  
  // Payment Processing
  | 'payments.process'
  | 'payments.refund'
  | 'payments.void'
  | 'payments.view_history'
  
  // Reporting & Analytics
  | 'reports.view_daily'
  | 'reports.view_weekly'
  | 'reports.view_monthly'
  | 'reports.export'
  | 'analytics.view_dashboard'
  | 'analytics.view_detailed'
  
  // System Administration
  | 'system.settings'
  | 'system.backup'
  | 'system.audit_logs'
  | 'system.manage_taxes'
  
  // Inventory (Future)
  | 'inventory.view'
  | 'inventory.update'
  | 'inventory.create'
  | 'inventory.reports';

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full system access
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles', 'users.view_all',
    'menu.create', 'menu.read', 'menu.update', 'menu.delete', 'menu.manage_categories', 'menu.toggle_availability', 'menu.update_pricing',
    'orders.create', 'orders.read', 'orders.update', 'orders.delete', 'orders.void', 'orders.transfer', 'orders.split', 'orders.view_all',
    'kitchen.view_orders', 'kitchen.update_status', 'kitchen.mark_ready',
    'payments.process', 'payments.refund', 'payments.void', 'payments.view_history',
    'reports.view_daily', 'reports.view_weekly', 'reports.view_monthly', 'reports.export',
    'analytics.view_dashboard', 'analytics.view_detailed',
    'system.settings', 'system.backup', 'system.audit_logs', 'system.manage_taxes',
    'inventory.view', 'inventory.update', 'inventory.create', 'inventory.reports'
  ],
  
  manager: [
    // User management (limited)
    'users.create', 'users.read', 'users.update', 'users.view_all',
    // Full menu management
    'menu.create', 'menu.read', 'menu.update', 'menu.delete', 'menu.manage_categories', 'menu.toggle_availability', 'menu.update_pricing',
    // Full order management
    'orders.create', 'orders.read', 'orders.update', 'orders.void', 'orders.transfer', 'orders.split', 'orders.view_all',
    // Kitchen visibility
    'kitchen.view_orders', 'kitchen.update_status', 'kitchen.mark_ready',
    // Payment processing
    'payments.process', 'payments.refund', 'payments.void', 'payments.view_history',
    // Full reporting
    'reports.view_daily', 'reports.view_weekly', 'reports.view_monthly', 'reports.export',
    'analytics.view_dashboard', 'analytics.view_detailed',
    // System settings (limited)
    'system.settings', 'system.manage_taxes',
    // Inventory
    'inventory.view', 'inventory.update', 'inventory.create', 'inventory.reports'
  ],
  
  server: [
    // Basic user info
    'users.read',
    // Menu viewing
    'menu.read', 'menu.toggle_availability',
    // Order management
    'orders.create', 'orders.read', 'orders.update', 'orders.transfer', 'orders.split',
    // Basic payment
    'payments.process',
    // Limited reporting
    'reports.view_daily', 'analytics.view_dashboard',
    // Inventory viewing
    'inventory.view'
  ],
  
  cashier: [
    // Basic user info
    'users.read',
    // Menu viewing
    'menu.read',
    // Order viewing and payment
    'orders.read', 'orders.update',
    // Full payment processing
    'payments.process', 'payments.refund', 'payments.view_history',
    // Limited reporting
    'reports.view_daily', 'analytics.view_dashboard'
  ],
  
  kitchen: [
    // Menu viewing (for preparation details)
    'menu.read',
    // Kitchen operations
    'kitchen.view_orders', 'kitchen.update_status', 'kitchen.mark_ready',
    // Basic order info
    'orders.read',
    // Basic inventory
    'inventory.view'
  ],
  
  viewer: [
    // Read-only access for reporting
    'users.read',
    'menu.read',
    'orders.read', 'orders.view_all',
    'reports.view_daily', 'reports.view_weekly', 'reports.view_monthly',
    'analytics.view_dashboard', 'analytics.view_detailed',
    'inventory.view'
  ]
};

// Permission checking utilities
export class PermissionChecker {
  private userRole: UserRole;
  private permissions: Permission[];

  constructor(userRole: UserRole) {
    this.userRole = userRole;
    this.permissions = ROLE_PERMISSIONS[userRole] || [];
  }

  // Check if user has a specific permission
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Get all permissions for the user's role
  getAllPermissions(): Permission[] {
    return [...this.permissions];
  }

  // Role-specific helper methods
  canManageUsers(): boolean {
    return this.hasPermission('users.manage_roles');
  }

  canManageMenu(): boolean {
    return this.hasAnyPermission(['menu.create', 'menu.update', 'menu.delete']);
  }

  canProcessPayments(): boolean {
    return this.hasPermission('payments.process');
  }

  canVoidOrders(): boolean {
    return this.hasPermission('orders.void');
  }

  canViewReports(): boolean {
    return this.hasAnyPermission(['reports.view_daily', 'reports.view_weekly', 'reports.view_monthly']);
  }

  canAccessKitchen(): boolean {
    return this.hasPermission('kitchen.view_orders');
  }

  canManageSystem(): boolean {
    return this.hasAnyPermission(['system.settings', 'system.backup', 'system.audit_logs']);
  }

  // Check permissions for specific operations
  canCreateOrder(): boolean {
    return this.hasPermission('orders.create');
  }

  canUpdateOrder(isOwnOrder: boolean = false): boolean {
    if (this.hasPermission('orders.update')) return true;
    // Servers can update their own orders
    return isOwnOrder && this.userRole === 'server';
  }

  canViewAllOrders(): boolean {
    return this.hasPermission('orders.view_all');
  }

  canRefundPayment(): boolean {
    return this.hasPermission('payments.refund');
  }
}

// React hook for permission checking
export const usePermissions = (userRole?: UserRole) => {
  if (!userRole) {
    return new PermissionChecker('viewer'); // Default to minimal permissions
  }
  
  return new PermissionChecker(userRole);
};

// Permission-based component props
export interface PermissionGuardProps {
  permission: Permission | Permission[];
  userRole?: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Higher-order component for permission-based rendering
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission | Permission[]
) {
  return (props: P & { userRole?: UserRole }) => {
    const { userRole, ...componentProps } = props;
    const permissions = usePermissions(userRole);
    
    const hasAccess = Array.isArray(requiredPermissions)
      ? permissions.hasAnyPermission(requiredPermissions)
      : permissions.hasPermission(requiredPermissions);

    if (!hasAccess) {
      return null;
    }

    return React.createElement(Component, componentProps as P);
  };
}

// Route-level permission configuration
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': ['analytics.view_dashboard'],
  '/menu': ['menu.read'],
  '/menu/manage': ['menu.create', 'menu.update'],
  '/orders': ['orders.read'],
  '/orders/new': ['orders.create'],
  '/kitchen': ['kitchen.view_orders'],
  '/payments': ['payments.process'],
  '/reports': ['reports.view_daily'],
  '/reports/analytics': ['analytics.view_detailed'],
  '/admin/users': ['users.manage_roles'],
  '/admin/system': ['system.settings'],
};

// Get required permissions for a route
export const getRoutePermissions = (path: string): Permission[] => {
  // Find the most specific matching route
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => path.startsWith(route))
    .sort((a, b) => b.length - a.length);

  return matchingRoutes.length > 0 ? ROUTE_PERMISSIONS[matchingRoutes[0]] : [];
};

// Check if user can access a route
export const canAccessRoute = (path: string, userRole: UserRole): boolean => {
  const requiredPermissions = getRoutePermissions(path);
  if (requiredPermissions.length === 0) return true; // No restrictions
  
  const permissions = new PermissionChecker(userRole);
  return permissions.hasAnyPermission(requiredPermissions);
};

// Audit logging for permission checks (for future implementation)
export interface PermissionAudit {
  userId: string;
  userRole: UserRole;
  permission: Permission;
  resource?: string;
  action: 'granted' | 'denied';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const logPermissionCheck = (audit: PermissionAudit): void => {
  // TODO: Implement audit logging to database
  if (process.env.NODE_ENV === 'development') {
    console.log('Permission Check:', audit);
  }
};
