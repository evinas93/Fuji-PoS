// Authentication middleware for protected routes
import type { Request, Response, NextFunction } from 'express';
import { createSupabaseClient } from '../config/supabase';
import type { UserRole } from '../../types/database';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        full_name: string;
        pin_code: string | null;
        is_active: boolean;
      };
      requestId?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
      return;
    }

    // Create Supabase client with the user's token
    const supabase = createSupabaseClient(token);

    // Verify the token and get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User profile not found',
      });
      return;
    }

    // Check if user is active
    if (!profile.is_active) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User account is not active',
      });
      return;
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile.role,
      full_name: profile.full_name,
      pin_code: profile.pin_code,
      is_active: profile.is_active,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: ('admin' | 'manager' | 'server' | 'cashier' | 'kitchen' | 'viewer')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

// Specific role middleware functions
export const requireAdmin = requireRole(['admin']);
export const requireManager = requireRole(['admin', 'manager']);
export const requireServerOrManager = requireRole(['admin', 'manager', 'server']);
export const requireCashierOrManager = requireRole(['admin', 'manager', 'cashier']);
export const requireKitchenOrManager = requireRole(['admin', 'manager', 'kitchen']);

// Manager or specific user middleware (for profile updates)
export const requireManagerOrSelf = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
    return;
  }

  const targetUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.role === 'manager' || req.user.id === targetUserId) {
    next();
  } else {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Managers can access all profiles, users can only access their own.',
    });
  }
};
