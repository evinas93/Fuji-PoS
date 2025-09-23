// Session management hook with timeout and security features
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useCurrentUser, useSignOut } from './useAuth';

interface UseSessionOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onSessionExpiry?: () => void;
  onInactivityWarning?: () => void;
}

interface SessionState {
  isSessionValid: boolean;
  timeRemaining: number;
  showWarning: boolean;
  lastActivity: Date;
}

export const useSession = (options: UseSessionOptions = {}) => {
  const {
    timeoutMinutes = 15, // 15 minutes default timeout
    warningMinutes = 2, // Show warning 2 minutes before timeout
    onSessionExpiry,
    onInactivityWarning,
  } = options;

  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const signOutMutation = useSignOut();

  const [sessionState, setSessionState] = useState<SessionState>({
    isSessionValid: false,
    timeRemaining: timeoutMinutes * 60,
    showWarning: false,
    lastActivity: new Date(),
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Reset session timer
  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const now = new Date();
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      timeRemaining: timeoutMinutes * 60,
      showWarning: false,
    }));

    // Set warning timer
    const warningTimeout = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      setSessionState(prev => ({ ...prev, showWarning: true }));
      onInactivityWarning?.();
    }, warningTimeout);

    // Set session expiry timer
    const sessionTimeout = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, sessionTimeout);

    // Set countdown interval
    intervalRef.current = setInterval(() => {
      setSessionState(prev => {
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);
  };

  // Handle session expiry
  const handleSessionExpiry = async () => {
    try {
      await signOutMutation.mutateAsync();
      setSessionState(prev => ({ ...prev, isSessionValid: false }));
      onSessionExpiry?.();
      router.push('/auth/login?expired=true');
    } catch (error) {
      console.error('Error during session expiry:', error);
      // Force redirect even if logout fails
      router.push('/auth/login?expired=true');
    }
  };

  // Extend session (reset timer)
  const extendSession = () => {
    if (currentUser) {
      resetTimer();
    }
  };

  // Manual logout
  const logout = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  // Activity tracking
  useEffect(() => {
    if (!currentUser || isLoading) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let lastActivityTime = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      // Only reset timer if at least 30 seconds have passed since last activity
      if (now - lastActivityTime > 30000) {
        lastActivityTime = now;
        resetTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();
    setSessionState(prev => ({ ...prev, isSessionValid: true }));

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUser, isLoading]);

  // Handle browser visibility change (pause/resume timer)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause timers when tab is not visible
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        // Resume timers when tab becomes visible
        if (currentUser && sessionState.isSessionValid) {
          resetTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, sessionState.isSessionValid]);

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    ...sessionState,
    extendSession,
    logout,
    formatTimeRemaining: formatTimeRemaining(sessionState.timeRemaining),
    isAuthenticated: !!currentUser && sessionState.isSessionValid,
    isLoading,
  };
};

// Hook for session warning modal
export const useSessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  const dismissWarning = () => setShowWarning(false);
  const showSessionWarning = () => setShowWarning(true);

  return {
    showWarning,
    dismissWarning,
    showSessionWarning,
  };
};
