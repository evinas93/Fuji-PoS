// Authentication service for Fuji POS System
import { supabase } from '../supabase';
import type { User, UserInsert, UserRole } from '../../types/database';

export class AuthService {
  // PIN-based quick login for POS terminals
  async loginWithPin(email: string, pin: string) {
    try {
      // First verify PIN against users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, pin_code, is_active, role')
        .eq('email', email)
        .eq('pin_code', pin)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        throw new Error('Invalid PIN or email');
      }

      // For PIN login, we'll use a service role approach or implement custom auth
      // This is a simplified version - in production, you'd need proper session management
      return { 
        data: { 
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Regular email/password login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { data: null, error };

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('User profile not found or inactive') };
    }

    return { 
      data: { 
        ...data, 
        profile 
      }, 
      error: null 
    };
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  // Create new staff member (admin/manager only)
  async createStaffMember(userData: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    pin_code: string;
    hourly_rate?: number;
  }) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      });

      if (authError || !authData.user) {
        throw authError || new Error('Failed to create auth user');
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          pin_code: userData.pin_code,
          hourly_rate: userData.hourly_rate || null,
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      return { data: profile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Clock in/out for shifts
  async clockIn(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        user_id: userId,
        shift_date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  }

  async clockOut(userId: string) {
    // Find the active shift (no clock_out time)
    const { data: activeShift, error: findError } = await supabase
      .from('shifts')
      .select('id')
      .eq('user_id', userId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .single();

    if (findError || !activeShift) {
      return { data: null, error: new Error('No active shift found') };
    }

    const { data, error } = await supabase
      .from('shifts')
      .update({
        clock_out: new Date().toISOString()
      })
      .eq('id', activeShift.id)
      .select()
      .single();

    return { data, error };
  }

  // Get current user session
  async getCurrentUser() {
    console.log('🔍 AuthService.getCurrentUser: Starting...');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 AuthService.getCurrentUser: Session check result', { session: !!session, sessionError });

      if (sessionError || !session) {
        console.log('❌ AuthService.getCurrentUser: No session or error');
        return { data: null, error: sessionError || new Error('No active session') };
      }

      console.log('🔍 AuthService.getCurrentUser: Fetching profile for user:', session.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('🔍 AuthService.getCurrentUser: Profile result', { profile: !!profile, profileError });

      if (profileError) {
        console.log('❌ AuthService.getCurrentUser: Profile error:', profileError);
        return { data: null, error: profileError };
      }

      console.log('✅ AuthService.getCurrentUser: Success');
      return {
        data: {
          user: session.user,
          profile
        },
        error: null
      };
    } catch (error) {
      console.log('❌ AuthService.getCurrentUser: Caught error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserInsert>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  // Change password
  async changePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    return { data, error };
  }

  // Get all staff members (for managers)
  async getStaffMembers(role?: UserRole) {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    return { data, error };
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }
}

