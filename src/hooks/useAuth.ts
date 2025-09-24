// React hooks for authentication
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../lib/services/auth.service';
import type { UserRole } from '../types/database';

const authService = new AuthService();

// Hook to get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      console.log('🔍 useCurrentUser: Fetching current user...');
      try {
        const { data, error } = await authService.getCurrentUser();
        if (error) {
          console.log('❌ useCurrentUser: Error:', error.message);
          throw error;
        }
        console.log('✅ useCurrentUser: Success:', data);
        return data;
      } catch (error) {
        console.log('❌ useCurrentUser: Caught error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth failures
  });
}

// Hook to sign in
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Cache the user data
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

// Hook to sign in with PIN (for POS terminals)
export function useSignInWithPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, pin }: { email: string; pin: string }) => {
      const { data, error } = await authService.loginWithPin(email, pin);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    },
  });
}

// Hook to sign out
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authService.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all cached data on sign out
      queryClient.clear();
    },
  });
}

// Hook to create staff member (admin/manager only)
export function useCreateStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      full_name: string;
      role: UserRole;
      pin_code: string;
      hourly_rate?: number;
    }) => {
      const { data, error } = await authService.createStaffMember(userData);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });
}

// Hook to clock in
export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authService.clockIn(userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
      queryClient.invalidateQueries({ queryKey: ['realtimeMetrics'] });
    },
  });
}

// Hook to clock out
export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authService.clockOut(userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
      queryClient.invalidateQueries({ queryKey: ['realtimeMetrics'] });
    },
  });
}

// Hook to update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<{
        full_name: string;
        pin_code: string;
        hourly_rate: number;
      }>;
    }) => {
      const { data, error } = await authService.updateProfile(userId, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });
}

// Hook to change password
export function useChangePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { data, error } = await authService.changePassword(newPassword);
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get staff members (for managers)
export function useStaffMembers(role?: UserRole) {
  return useQuery({
    queryKey: ['staffMembers', role],
    queryFn: async () => {
      const { data, error } = await authService.getStaffMembers(role);
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to deactivate user
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authService.deactivateUser(userId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
    },
  });
}

// Hook to check user permissions
export function usePermissions() {
  const { data: currentUser } = useCurrentUser();

  return {
    isAdmin: currentUser?.profile?.role === 'admin',
    isManager: currentUser?.profile?.role === 'manager',
    isServer: currentUser?.profile?.role === 'server',
    isCashier: currentUser?.profile?.role === 'cashier',
    isKitchen: currentUser?.profile?.role === 'kitchen',
    isViewer: currentUser?.profile?.role === 'viewer',

    canManageMenu: ['admin', 'manager'].includes(currentUser?.profile?.role || ''),
    canManageUsers: ['admin', 'manager'].includes(currentUser?.profile?.role || ''),
    canProcessPayments: ['admin', 'manager', 'cashier'].includes(currentUser?.profile?.role || ''),
    canTakeOrders: ['admin', 'manager', 'server', 'cashier'].includes(
      currentUser?.profile?.role || ''
    ),
    canViewKitchen: ['admin', 'manager', 'kitchen'].includes(currentUser?.profile?.role || ''),
    canViewReports: ['admin', 'manager', 'viewer'].includes(currentUser?.profile?.role || ''),
    canVoidOrders: ['admin', 'manager'].includes(currentUser?.profile?.role || ''),

    userId: currentUser?.profile?.id,
    userRole: currentUser?.profile?.role,
    fullName: currentUser?.profile?.full_name,
  };
}

// Hook for role-based component rendering
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { userRole } = usePermissions();

  return {
    hasAccess: userRole ? allowedRoles.includes(userRole) : false,
    userRole,
  };
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  return {
    isAuthenticated: !!currentUser && !error,
    isLoading,
    user: currentUser?.profile,
    session: currentUser?.user,
  };
}

// General useAuth hook for backward compatibility
export function useAuth() {
  const { data: currentUser, isLoading, error } = useCurrentUser();

  return {
    user: currentUser?.profile,
    session: currentUser?.user,
    isLoading,
    error,
    isAuthenticated: !!currentUser && !error,
  };
}
