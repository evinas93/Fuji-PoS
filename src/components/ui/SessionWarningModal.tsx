// Session warning modal component
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SessionWarningModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  timeRemaining: string;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  onExtendSession,
  onLogout,
  timeRemaining,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onExtendSession}
      title="Session Expiring Soon"
      size="md"
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        {/* Warning Icon and Message */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800">
              Your session will expire in <strong className="text-red-600">{timeRemaining}</strong> due to inactivity.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Would you like to extend your session or log out now?
            </p>
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full transition-all duration-1000"
            style={{ 
              width: `${Math.max(10, (parseInt(timeRemaining.split(':')[0]) * 60 + parseInt(timeRemaining.split(':')[1])) / 120 * 100)}%` 
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 justify-end pt-4">
          <Button
            variant="secondary"
            onClick={onLogout}
            className="px-4 py-2"
          >
            Log Out Now
          </Button>
          <Button
            variant="primary"
            onClick={onExtendSession}
            className="px-4 py-2"
          >
            Stay Signed In
          </Button>
        </div>

        {/* Security Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-blue-700">
                For security reasons, sessions automatically expire after periods of inactivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SessionWarningModal;
