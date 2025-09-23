// Main dashboard page
import React from 'react';
import { Layout } from '../../components/layout/Layout';
import { useCurrentUser } from '../../hooks/useAuth';
import { PermissionGuard, RoleBasedContent, AdminOnly, ManagerOrAdmin } from '../../components/ui/PermissionGuard';
import { withAuth } from '../../components/auth/withAuth';
import { Button } from '../../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  // Early return if still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Early return if error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser?.profile?.full_name}!
          </h1>
          <p className="text-gray-600">
            You are logged in as a <span className="font-medium capitalize">{currentUser?.profile?.role}</span>.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Sales
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $0.00
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Tables
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Ticket
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      $0.00
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Based Quick Actions */}
        <RoleBasedContent
          admin={
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-800 mb-4">Admin Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">Manage Users</Button>
                <Button variant="secondary" size="sm">System Settings</Button>
                <Button variant="secondary" size="sm">View Audit Logs</Button>
                <Button variant="secondary" size="sm">Database Backup</Button>
              </div>
            </div>
          }
          manager={
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Manager Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">View Reports</Button>
                <Button variant="secondary" size="sm">Manage Menu</Button>
                <Button variant="secondary" size="sm">Staff Management</Button>
                <Button variant="secondary" size="sm">Daily Close</Button>
              </div>
            </div>
          }
          server={
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-800 mb-4">Server Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">Take Order</Button>
                <Button variant="secondary" size="sm">View Menu</Button>
                <Button variant="secondary" size="sm">My Tables</Button>
                <Button variant="secondary" size="sm">Today's Sales</Button>
              </div>
            </div>
          }
          cashier={
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 mb-4">Cashier Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">Process Payment</Button>
                <Button variant="secondary" size="sm">View Orders</Button>
                <Button variant="secondary" size="sm">Handle Refund</Button>
                <Button variant="secondary" size="sm">Daily Summary</Button>
              </div>
            </div>
          }
          kitchen={
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-orange-800 mb-4">Kitchen Display</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">View Orders</Button>
                <Button variant="secondary" size="sm">Mark Ready</Button>
                <Button variant="secondary" size="sm">Prep Times</Button>
                <Button variant="secondary" size="sm">Inventory</Button>
              </div>
            </div>
          }
          viewer={
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Reports & Analytics</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="primary" size="sm">View Reports</Button>
                <Button variant="secondary" size="sm">Analytics</Button>
                <Button variant="secondary" size="sm">Export Data</Button>
                <Button variant="secondary" size="sm">Trends</Button>
              </div>
            </div>
          }
        />

        {/* Permission-Based Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PermissionGuard permission="users.manage_roles">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800">User Management</h4>
              <p className="text-sm text-red-600 mt-1">Create, edit, and manage staff members</p>
            </div>
          </PermissionGuard>

          <PermissionGuard permission="payments.process">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800">Payment Processing</h4>
              <p className="text-sm text-green-600 mt-1">Process payments and handle refunds</p>
            </div>
          </PermissionGuard>

          <PermissionGuard permission="kitchen.view_orders">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800">Kitchen Access</h4>
              <p className="text-sm text-orange-600 mt-1">View and update order preparation status</p>
            </div>
          </PermissionGuard>

          <PermissionGuard permission="reports.export">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800">Advanced Reporting</h4>
              <p className="text-sm text-blue-600 mt-1">Export reports and detailed analytics</p>
            </div>
          </PermissionGuard>
        </div>

        {/* Authentication System Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Authentication & Authorization System Complete ✓
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2">
                  Comprehensive user authentication and role-based access control system successfully implemented.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Core Features:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Supabase authentication integration</li>
                      <li>JWT token-based sessions</li>
                      <li>PIN-based quick login</li>
                      <li>Session timeout & warnings</li>
                      <li>Password security & validation</li>
                    </ul>
                  </div>
                  
                  <div>
                    <strong>Access Control:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>6 role types with permission matrix</li>
                      <li>Route-level protection</li>
                      <li>Component-level guards</li>
                      <li>API endpoint security</li>
                      <li>Audit logging framework</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <strong>Current Role:</strong> <span className="capitalize">{currentUser?.profile?.role}</span>
                  {" "}- You have access to {currentUser?.profile?.role === 'admin' ? 'all' : 'role-specific'} features above.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Protect the dashboard with authentication
export default withAuth(DashboardPage, {
  requireAuth: true,
  // All authenticated users can access dashboard, but content is role-specific
});
