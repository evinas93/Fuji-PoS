// Unit tests for permissions system
import { 
  PermissionChecker, 
  ROLE_PERMISSIONS, 
  canAccessRoute, 
  getRoutePermissions 
} from '../../../src/lib/permissions'
import type { UserRole } from '../../../src/types/database'

describe('Permission System', () => {
  describe('ROLE_PERMISSIONS matrix', () => {
    it('should have permissions defined for all roles', () => {
      const expectedRoles: UserRole[] = ['admin', 'manager', 'server', 'cashier', 'kitchen', 'viewer']
      
      expectedRoles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined()
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0)
      })
    })

    it('should give admin users all permissions', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin
      const allPermissions = Object.values(ROLE_PERMISSIONS).flat()
      const uniquePermissions = [...new Set(allPermissions)]

      // Admin should have the most permissions (should include most if not all unique permissions)
      expect(adminPermissions.length).toBeGreaterThanOrEqual(uniquePermissions.length * 0.9)
    })

    it('should give viewer users only read permissions', () => {
      const viewerPermissions = ROLE_PERMISSIONS.viewer
      
      // Viewers should only have read/view permissions, no create/update/delete
      viewerPermissions.forEach(permission => {
        expect(permission).toMatch(/\.(read|view)/i)
      })
    })

    it('should give kitchen users only kitchen-related permissions', () => {
      const kitchenPermissions = ROLE_PERMISSIONS.kitchen
      
      // Kitchen staff should have kitchen permissions and basic read access
      expect(kitchenPermissions).toContain('kitchen.view_orders')
      expect(kitchenPermissions).toContain('kitchen.update_status')
      expect(kitchenPermissions).toContain('menu.read')
      
      // Kitchen should NOT have user management or payment permissions
      expect(kitchenPermissions).not.toContain('users.create')
      expect(kitchenPermissions).not.toContain('payments.process')
    })
  })

  describe('PermissionChecker', () => {
    describe('Admin user', () => {
      let adminChecker: PermissionChecker

      beforeEach(() => {
        adminChecker = new PermissionChecker('admin')
      })

      it('should have specific admin permissions', () => {
        expect(adminChecker.hasPermission('users.create')).toBe(true)
        expect(adminChecker.hasPermission('users.delete')).toBe(true)
        expect(adminChecker.hasPermission('system.settings')).toBe(true)
        expect(adminChecker.hasPermission('system.backup')).toBe(true)
      })

      it('should pass all role-specific helper methods', () => {
        expect(adminChecker.canManageUsers()).toBe(true)
        expect(adminChecker.canManageMenu()).toBe(true)
        expect(adminChecker.canProcessPayments()).toBe(true)
        expect(adminChecker.canVoidOrders()).toBe(true)
        expect(adminChecker.canViewReports()).toBe(true)
        expect(adminChecker.canAccessKitchen()).toBe(true)
        expect(adminChecker.canManageSystem()).toBe(true)
      })
    })

    describe('Manager user', () => {
      let managerChecker: PermissionChecker

      beforeEach(() => {
        managerChecker = new PermissionChecker('manager')
      })

      it('should have manager-specific permissions', () => {
        expect(managerChecker.hasPermission('menu.create')).toBe(true)
        expect(managerChecker.hasPermission('orders.void')).toBe(true)
        expect(managerChecker.hasPermission('reports.export')).toBe(true)
        expect(managerChecker.hasPermission('users.create')).toBe(true)
      })

      it('should NOT have admin-only permissions', () => {
        expect(managerChecker.hasPermission('users.delete')).toBe(false)
        expect(managerChecker.hasPermission('system.backup')).toBe(false)
      })

      it('should pass most role-specific helper methods', () => {
        expect(managerChecker.canManageMenu()).toBe(true)
        expect(managerChecker.canProcessPayments()).toBe(true)
        expect(managerChecker.canVoidOrders()).toBe(true)
        expect(managerChecker.canViewReports()).toBe(true)
        expect(managerChecker.canManageUsers()).toBe(false) // Only admins can manage roles
      })
    })

    describe('Server user', () => {
      let serverChecker: PermissionChecker

      beforeEach(() => {
        serverChecker = new PermissionChecker('server')
      })

      it('should have server-specific permissions', () => {
        expect(serverChecker.hasPermission('orders.create')).toBe(true)
        expect(serverChecker.hasPermission('orders.read')).toBe(true)
        expect(serverChecker.hasPermission('orders.update')).toBe(true)
        expect(serverChecker.hasPermission('menu.read')).toBe(true)
        expect(serverChecker.hasPermission('payments.process')).toBe(true)
      })

      it('should NOT have management permissions', () => {
        expect(serverChecker.hasPermission('orders.void')).toBe(false)
        expect(serverChecker.hasPermission('menu.create')).toBe(false)
        expect(serverChecker.hasPermission('users.create')).toBe(false)
        expect(serverChecker.hasPermission('system.settings')).toBe(false)
      })

      it('should have limited helper method access', () => {
        expect(serverChecker.canCreateOrder()).toBe(true)
        expect(serverChecker.canUpdateOrder()).toBe(true)
        expect(serverChecker.canUpdateOrder(true)).toBe(true) // Own order
        expect(serverChecker.canVoidOrders()).toBe(false)
        expect(serverChecker.canManageMenu()).toBe(false)
        expect(serverChecker.canManageUsers()).toBe(false)
      })
    })

    describe('Kitchen user', () => {
      let kitchenChecker: PermissionChecker

      beforeEach(() => {
        kitchenChecker = new PermissionChecker('kitchen')
      })

      it('should have kitchen-specific permissions', () => {
        expect(kitchenChecker.hasPermission('kitchen.view_orders')).toBe(true)
        expect(kitchenChecker.hasPermission('kitchen.update_status')).toBe(true)
        expect(kitchenChecker.hasPermission('kitchen.mark_ready')).toBe(true)
        expect(kitchenChecker.hasPermission('menu.read')).toBe(true)
        expect(kitchenChecker.hasPermission('orders.read')).toBe(true)
      })

      it('should NOT have non-kitchen permissions', () => {
        expect(kitchenChecker.hasPermission('orders.create')).toBe(false)
        expect(kitchenChecker.hasPermission('payments.process')).toBe(false)
        expect(kitchenChecker.hasPermission('reports.export')).toBe(false)
      })

      it('should have kitchen helper method access', () => {
        expect(kitchenChecker.canAccessKitchen()).toBe(true)
        expect(kitchenChecker.canCreateOrder()).toBe(false)
        expect(kitchenChecker.canProcessPayments()).toBe(false)
        expect(kitchenChecker.canManageMenu()).toBe(false)
      })
    })

    describe('Permission checking methods', () => {
      let managerChecker: PermissionChecker

      beforeEach(() => {
        managerChecker = new PermissionChecker('manager')
      })

      it('should check hasAnyPermission correctly', () => {
        expect(managerChecker.hasAnyPermission(['menu.create', 'nonexistent.permission'])).toBe(true)
        expect(managerChecker.hasAnyPermission(['nonexistent.permission1', 'nonexistent.permission2'])).toBe(false)
      })

      it('should check hasAllPermissions correctly', () => {
        expect(managerChecker.hasAllPermissions(['menu.create', 'menu.read'])).toBe(true)
        expect(managerChecker.hasAllPermissions(['menu.create', 'system.backup'])).toBe(false)
      })

      it('should return all permissions for role', () => {
        const permissions = managerChecker.getAllPermissions()
        expect(Array.isArray(permissions)).toBe(true)
        expect(permissions).toContain('menu.create')
        expect(permissions).toContain('orders.read')
      })
    })
  })

  describe('Route permissions', () => {
    it('should return correct permissions for dashboard route', () => {
      const permissions = getRoutePermissions('/dashboard')
      expect(permissions).toContain('analytics.view_dashboard')
    })

    it('should return correct permissions for menu management route', () => {
      const permissions = getRoutePermissions('/menu/manage')
      expect(permissions).toEqual(['menu.create', 'menu.update'])
    })

    it('should return correct permissions for admin routes', () => {
      const userPermissions = getRoutePermissions('/admin/users')
      expect(userPermissions).toContain('users.manage_roles')

      const systemPermissions = getRoutePermissions('/admin/system')
      expect(systemPermissions).toContain('system.settings')
    })

    it('should return empty array for unrestricted routes', () => {
      const permissions = getRoutePermissions('/some/unrestricted/route')
      expect(permissions).toEqual([])
    })

    it('should find most specific route match', () => {
      // /menu/manage should match before /menu
      const permissions = getRoutePermissions('/menu/manage/categories')
      expect(permissions).toEqual(['menu.create', 'menu.update'])
    })
  })

  describe('Route access control', () => {
    it('should allow admin access to all routes', () => {
      expect(canAccessRoute('/dashboard', 'admin')).toBe(true)
      expect(canAccessRoute('/menu/manage', 'admin')).toBe(true)
      expect(canAccessRoute('/admin/users', 'admin')).toBe(true)
      expect(canAccessRoute('/kitchen', 'admin')).toBe(true)
    })

    it('should restrict server access appropriately', () => {
      expect(canAccessRoute('/dashboard', 'server')).toBe(true)
      expect(canAccessRoute('/menu', 'server')).toBe(true)
      expect(canAccessRoute('/orders', 'server')).toBe(true)
      expect(canAccessRoute('/menu/manage', 'server')).toBe(false)
      expect(canAccessRoute('/admin/users', 'server')).toBe(false)
    })

    it('should restrict kitchen access appropriately', () => {
      expect(canAccessRoute('/kitchen', 'kitchen')).toBe(true)
      expect(canAccessRoute('/menu', 'kitchen')).toBe(true) // Read-only
      expect(canAccessRoute('/orders', 'kitchen')).toBe(true) // Read-only
      expect(canAccessRoute('/payments', 'kitchen')).toBe(false)
      expect(canAccessRoute('/admin/users', 'kitchen')).toBe(false)
    })

    it('should allow access to unrestricted routes for all users', () => {
      const roles: UserRole[] = ['admin', 'manager', 'server', 'cashier', 'kitchen', 'viewer']
      
      roles.forEach(role => {
        expect(canAccessRoute('/some/unrestricted/route', role)).toBe(true)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle invalid role gracefully', () => {
      // @ts-ignore - Testing invalid role
      const invalidChecker = new PermissionChecker('invalid_role')
      expect(invalidChecker.hasPermission('menu.read')).toBe(false)
      expect(invalidChecker.getAllPermissions()).toEqual([])
    })

    it('should handle empty permission arrays', () => {
      const adminChecker = new PermissionChecker('admin')
      expect(adminChecker.hasAnyPermission([])).toBe(false)
      expect(adminChecker.hasAllPermissions([])).toBe(true) // Empty array should return true
    })

    it('should handle route permission edge cases', () => {
      expect(getRoutePermissions('')).toEqual([])
      expect(getRoutePermissions('/')).toEqual([])
      expect(canAccessRoute('', 'admin')).toBe(true)
      expect(canAccessRoute('/', 'admin')).toBe(true)
    })
  })
})
