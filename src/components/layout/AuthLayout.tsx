// Authentication pages layout component
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Fuji Restaurant POS
          </h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main content */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Fuji Restaurant POS System v1.0</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
