// Main layout wrapper with session management
import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from '../../hooks/useSession';
import { useCurrentUser } from '../../hooks/useAuth';
import { SessionWarningModal } from '../ui/SessionWarningModal';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = true,
  title,
}) => {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  
  const {
    showWarning,
    extendSession,
    logout,
    formatTimeRemaining,
    isAuthenticated,
  } = useSession({
    timeoutMinutes: 15,
    warningMinutes: 2,
    onSessionExpiry: () => {
      console.log('Session expired');
    },
    onInactivityWarning: () => {
      console.log('Session warning shown');
    },
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !router.pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading screen while checking authentication
  if (isLoading || (!isAuthenticated && !router.pathname.startsWith('/auth'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show main layout on auth pages
  if (router.pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Warning Modal */}
      <SessionWarningModal
        isOpen={showWarning}
        onExtendSession={extendSession}
        onLogout={logout}
        timeRemaining={formatTimeRemaining}
      />

      {/* Header */}
      <Header title={title} />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && isAuthenticated && (
          <Sidebar currentUser={currentUser?.profile} />
        )}

        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'ml-64' : ''} mt-16`}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
