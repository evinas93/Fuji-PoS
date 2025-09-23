// User login form component
import React, { useState } from 'react';
import { useSignIn, useSignInWithPin } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'email' | 'pin'>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    pin: '',
  });

  const signInMutation = useSignIn();
  const signInWithPinMutation = useSignInWithPin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginMode === 'email') {
        await signInMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await signInWithPinMutation.mutateAsync({
          email: formData.email,
          pin: formData.pin,
        });
      }
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = loginMode === 'email' 
    ? formData.email && formData.password
    : formData.email && formData.pin;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Login Mode Toggle */}
      <div className="flex rounded-lg border border-gray-300">
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
            loginMode === 'email'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setLoginMode('email')}
        >
          Email & Password
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
            loginMode === 'pin'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setLoginMode('pin')}
        >
          Quick PIN Login
        </button>
      </div>

      {/* Email Field (common for both modes) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full"
        />
      </div>

      {/* Password or PIN Field */}
      {loginMode === 'email' ? (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
            PIN Code
          </label>
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            placeholder="Enter your 4-digit PIN"
            value={formData.pin}
            onChange={handleInputChange}
            className="w-full text-center text-lg tracking-widest"
            maxLength={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your 4-digit PIN for quick access
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </Button>

      {/* Forgot Password Link */}
      {loginMode === 'email' && (
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-indigo-600 hover:text-indigo-500"
            onClick={() => {/* TODO: Implement forgot password */}}
          >
            Forgot your password?
          </button>
        </div>
      )}

      {/* Error Messages */}
      {(signInMutation.error || signInWithPinMutation.error) && (
        <div className="text-sm text-red-600 text-center">
          {signInMutation.error?.message || signInWithPinMutation.error?.message}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
