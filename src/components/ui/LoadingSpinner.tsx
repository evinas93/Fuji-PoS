import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-indigo-600',
    secondary: 'border-gray-600',
    white: 'border-white',
  };

  const classes = [
    'animate-spin rounded-full border-2 border-t-transparent',
    sizeClasses[size],
    colorClasses[color],
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} role="status" aria-label="Loading" />;
};

export default LoadingSpinner;