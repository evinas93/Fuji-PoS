// Authentication routes
import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient, supabase } from '../config/supabase';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'manager', 'server', 'cashier', 'kitchen', 'viewer']).default('server'),
  pinCode: z.string().min(4, 'PIN code must be at least 4 digits').optional(),
  hourlyRate: z.number().min(0).optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// POST /api/auth/signup
// Create a new user account (manager only)
router.post('/signup', asyncHandler(async (req, res) => {
  const validatedData = signUpSchema.parse(req.body);

  // For security, only allow managers to create accounts
  // In production, this should be protected or have special admin endpoints
  
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email in development
    });

    if (authError || !authData.user) {
      throw new ValidationError(authError?.message || 'Failed to create user account');
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: validatedData.role,
        pin_code: validatedData.pinCode || null,
        hourly_rate: validatedData.hourlyRate || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new ValidationError(profileError.message);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        pinCode: profile.pin_code,
        hourlyRate: profile.hourly_rate,
        isActive: profile.is_active,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}));

// POST /api/auth/signin
// Authenticate user and return session
router.post('/signin', asyncHandler(async (req, res) => {
  const { email, password } = signInSchema.parse(req.body);

  const supabaseClient = createSupabaseClient();

  // Sign in user
  const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new UnauthorizedError('User profile not found');
  }

  if (!profile.is_active) {
    throw new UnauthorizedError('User account is not active');
  }

  res.json({
    message: 'Sign in successful',
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_at: authData.session.expires_at,
    },
    user: {
      id: profile.id,
      email: authData.user.email,
      fullName: profile.full_name,
      role: profile.role,
      pinCode: profile.pin_code,
      hourlyRate: profile.hourly_rate,
      isActive: profile.is_active,
    },
  });
}));

// POST /api/auth/signout
// Sign out user
router.post('/signout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createSupabaseClient(token);
    
    // Sign out from Supabase
    await supabaseClient.auth.signOut();
  }

  res.json({
    message: 'Signed out successfully',
  });
}));

// POST /api/auth/refresh
// Refresh access token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new ValidationError('Refresh token is required');
  }

  const supabaseClient = createSupabaseClient();

  const { data, error } = await supabaseClient.auth.refreshSession({
    refresh_token,
  });

  if (error || !data.session) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  res.json({
    message: 'Token refreshed successfully',
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
}));

// GET /api/auth/user
// Get current user information
router.get('/user', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new UnauthorizedError('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createSupabaseClient(token);

  // Get user from token
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new UnauthorizedError('User profile not found');
  }

  res.json({
    user: {
      id: profile.id,
      email: user.email,
      fullName: profile.full_name,
      role: profile.role,
      pinCode: profile.pin_code,
      hourlyRate: profile.hourly_rate,
      isActive: profile.is_active,
      createdAt: profile.created_at,
    },
  });
}));

// POST /api/auth/change-password
// Change user password
router.post('/change-password', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new UnauthorizedError('No authorization header provided');
  }

  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createSupabaseClient(token);

  // Verify current password by attempting to sign in
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user?.email) {
    throw new UnauthorizedError('User not found');
  }

  // Verify current password
  const { error: signInError } = await createSupabaseClient().auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Update password
  const { error: updateError } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  res.json({
    message: 'Password changed successfully',
  });
}));

// POST /api/auth/reset-password
// Request password reset
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email } = resetPasswordSchema.parse(req.body);
  
  const supabaseClient = createSupabaseClient();

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    console.error('Password reset error:', error);
    // Don't reveal whether the email exists or not
  }

  res.json({
    message: 'If an account with this email exists, a password reset link has been sent.',
  });
}));

export default router;
