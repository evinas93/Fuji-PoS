// Main navigation header
import React from 'react';
import { useRouter } from 'next/router';
import { useCurrentUser, useSignOut } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const signOutMutation = useSignOut();

  const handleLogout = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Fuji Restaurant POS
              </h1>
            </div>
            
            {title && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <span className="text-lg text-gray-700">{title}</span>
              </>
            )}
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {currentUser?.profile && (
              <>
                {/* User Info */}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{currentUser.profile.full_name}</span>
                  <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs capitalize">
                    {currentUser.profile.role}
                  </span>
                </div>

                {/* Logout Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={signOutMutation.isPending}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
