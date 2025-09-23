// Login page
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LoginForm } from '../../components/forms/LoginForm';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLoginSuccess = () => {
    setSuccess('Login successful! Redirecting...');
    setError(null);
    
    // Redirect to dashboard after successful login
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Welcome back! Please sign in to your account."
    >
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Manager:</strong> manager@fujirestaurant.com / password123</p>
            <p><strong>Server:</strong> server@fujirestaurant.com / password123</p>
            <p><strong>Cashier:</strong> cashier@fujirestaurant.com / password123</p>
            <p><strong>Kitchen:</strong> kitchen@fujirestaurant.com / password123</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
