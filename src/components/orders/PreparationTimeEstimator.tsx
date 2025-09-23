import React, { useState, useEffect } from 'react';
import { useOrderEstimate, useEstimatedWaitTime } from '../../hooks/useOrders';

interface PreparationTimeEstimatorProps {
  orderId?: string;
  showCurrentWait?: boolean;
  className?: string;
}

export default function PreparationTimeEstimator({ 
  orderId, 
  showCurrentWait = false, 
  className = '' 
}: PreparationTimeEstimatorProps) {
  const { data: orderEstimate } = useOrderEstimate(orderId || '');
  const { data: currentWaitTime } = useEstimatedWaitTime();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEstimatedReadyTime = (prepTime: number) => {
    const readyTime = new Date(currentTime.getTime() + prepTime * 60000);
    return readyTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (minutes: number) => {
    if (minutes <= 15) return 'text-green-600';
    if (minutes <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (minutes: number) => {
    if (minutes <= 15) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (minutes <= 30) {
      return (
        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Preparation Time</h3>
        <div className="text-xs text-gray-500">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {orderEstimate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated prep time:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(orderEstimate)}
              <span className={`font-semibold ${getStatusColor(orderEstimate)}`}>
                {formatTime(orderEstimate)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Ready by:</span>
            <span className="font-medium text-gray-900">
              {getEstimatedReadyTime(orderEstimate)}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                orderEstimate <= 15 ? 'bg-green-500' :
                orderEstimate <= 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, (orderEstimate / 60) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {showCurrentWait && currentWaitTime && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current wait time:</span>
            <span className="font-medium text-gray-900">
              {formatTime(currentWaitTime)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on kitchen queue
          </p>
        </div>
      )}

      {!orderEstimate && !currentWaitTime && (
        <div className="text-center py-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No preparation time data</p>
        </div>
      )}
    </div>
  );
}

