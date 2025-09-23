// Application footer
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2025 Fuji Restaurant POS System. All rights reserved.
          </div>
          <div className="text-sm text-gray-500">
            Version 1.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
