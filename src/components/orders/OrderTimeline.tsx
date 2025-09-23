import React from 'react';
import type { OrderStatus } from '../../types/database';

interface OrderTimelineProps {
  order: {
    id: string;
    status: OrderStatus;
    created_at: string;
    confirmed_at?: string;
    completed_at?: string;
    order_items?: Array<{
      id: string;
      status: OrderStatus;
      sent_to_kitchen_at?: string;
      prepared_at?: string;
      served_at?: string;
    }>;
  };
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const timelineSteps = [
    {
      key: 'created',
      label: 'Order Created',
      status: 'completed',
      timestamp: order.created_at,
      description: 'Order was created and is pending confirmation'
    },
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      status: order.status === 'pending' ? 'pending' : 'completed',
      timestamp: order.confirmed_at,
      description: 'Order confirmed and sent to kitchen'
    },
    {
      key: 'preparing',
      label: 'Preparing',
      status: ['preparing', 'ready', 'completed'].includes(order.status) ? 'completed' : 
              order.status === 'confirmed' ? 'in_progress' : 'pending',
      timestamp: order.order_items?.find(item => item.sent_to_kitchen_at)?.sent_to_kitchen_at,
      description: 'Kitchen is preparing the order'
    },
    {
      key: 'ready',
      label: 'Ready for Service',
      status: order.status === 'ready' ? 'completed' : 
              order.status === 'completed' ? 'completed' : 'pending',
      timestamp: order.order_items?.find(item => item.prepared_at)?.prepared_at,
      description: 'Order is ready to be served'
    },
    {
      key: 'completed',
      label: 'Order Completed',
      status: order.status === 'completed' ? 'completed' : 'pending',
      timestamp: order.completed_at,
      description: 'Order has been completed and served'
    }
  ];

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'pending':
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        );
    }
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
      
      <div className="space-y-4">
        {timelineSteps.map((step, index) => (
          <div key={step.key} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              {getStepIcon(step.status)}
              {index < timelineSteps.length - 1 && (
                <div className={`w-0.5 h-8 mt-2 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${getStepColor(step.status)}`}>
                  {step.label}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(step.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Kitchen Items Status */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Kitchen Items Status</h4>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.id.slice(0, 8)}...</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                  item.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

