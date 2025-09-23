// Higher-order component for route protection and authentication
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentUser } from '../../hooks/useAuth';
import { canAccessRoute, type Permission, logPermissionCheck } from '../../lib/permissions';
import type { UserRole } from '../../types/database';

interface WithAuthOptions {
  requiredPermissions?: Permission[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

// Loading component
const AuthLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Checking permissions...</p>
    </div>
  </div>
);

// Access denied component
const AccessDenied: React.FC<{ userRole?: string; requiredPermissions?: Permission[] }> = ({
  userRole,
  requiredPermissions
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      {userRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 text-left max-w-sm mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>Your Role:</strong> <span className="capitalize">{userRole}</span>
          </p>
          {requiredPermissions && requiredPermissions.length > 0 && (
            <p className="text-sm text-yellow-800 mt-1">
              <strong>Required:</strong> {requiredPermissions.join(', ')}
            </p>
          )}
        </div>
      )}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Go Back
      </button>
    </div>
  </div>
);

// HOC for protecting components with authentication and authorization
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredPermissions = [],
    allowedRoles = [],
    redirectTo = '/auth/login',
    requireAuth = true,
  } = options;

  const AuthProtectedComponent: React.FC<P> = (props) => {
    const router = useRouter();
    const { data: currentUser, isLoading, error } = useCurrentUser();

    useEffect(() => {
      // Don't redirect during initial load
      if (isLoading) return;

      // If authentication is required but user is not authenticated
      if (requireAuth && (!currentUser || error)) {
        router.push(`${redirectTo}?from=${encodeURIComponent(router.asPath)}`);
        return;
      }

      // If user is authenticated, check permissions
      if (currentUser?.profile) {
        const userRole = currentUser.profile.role;
        const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);
        const hasRouteAccess = canAccessRoute(router.pathname, userRole);
        
        // Log permission check for audit
        if (requiredPermissions.length > 0) {
          requiredPermissions.forEach(permission => {
            logPermissionCheck({
              userId: currentUser.profile!.id,
              userRole,
              permission,
              resource: router.pathname,
              action: hasRoleAccess && hasRouteAccess ? 'granted' : 'denied',
              timestamp: new Date(),
            });
          });
        }

        // If user doesn't have required role or route access, show access denied
        if (!hasRoleAccess || !hasRouteAccess) {
          // Don't redirect, just show access denied page
          return;
        }
      }
    }, [currentUser, isLoading, error, router]);

    // Show loading while checking authentication
    if (isLoading) {
      return <AuthLoader />;
    }

    // If authentication required but not authenticated, show loading
    // (redirection will happen in useEffect)
    if (requireAuth && (!currentUser || error)) {
      return <AuthLoader />;
    }

    // Check role and route access
    if (currentUser?.profile) {
      const userRole = currentUser.profile.role;
      const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);
      const hasRouteAccess = canAccessRoute(router.pathname, userRole);

      if (!hasRoleAccess || !hasRouteAccess) {
        return (
          <AccessDenied 
            userRole={userRole} 
            requiredPermissions={requiredPermissions}
          />
        );
      }
    }

    // User is authenticated and authorized, render the component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  AuthProtectedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthProtectedComponent;
}

// Convenience HOCs for common permission patterns
export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { allowedRoles: ['admin'] });

export const withManagerAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { allowedRoles: ['admin', 'manager'] });

export const withServerAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { allowedRoles: ['admin', 'manager', 'server'] });

export const withKitchenAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { allowedRoles: ['admin', 'manager', 'kitchen'] });

export const withCashierAuth = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { allowedRoles: ['admin', 'manager', 'cashier'] });

// Route-specific auth HOCs
export const withMenuManagement = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { 
    allowedRoles: ['admin', 'manager'],
    requiredPermissions: ['menu.create', 'menu.update'] 
  });

export const withPaymentAccess = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { 
    allowedRoles: ['admin', 'manager', 'cashier'],
    requiredPermissions: ['payments.process'] 
  });

export const withReportingAccess = <P extends object>(Component: React.ComponentType<P>) =>
  withAuth(Component, { 
    allowedRoles: ['admin', 'manager', 'viewer'],
    requiredPermissions: ['reports.view_daily'] 
  });

export default withAuth;
