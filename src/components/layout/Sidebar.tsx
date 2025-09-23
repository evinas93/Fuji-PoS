// Role-based sidebar navigation
import React from 'react';
import { useRouter } from 'next/router';
import type { User } from '../../types/database';

interface SidebarProps {
  currentUser?: User;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const router = useRouter();

  const navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      roles: ['admin', 'manager', 'server', 'cashier', 'kitchen', 'viewer'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      name: 'Orders',
      href: '/orders',
      roles: ['admin', 'manager', 'server', 'cashier'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Menu',
      href: '/menu',
      roles: ['admin', 'manager', 'server'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Kitchen',
      href: '/kitchen',
      roles: ['admin', 'manager', 'kitchen'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Payments',
      href: '/payments',
      roles: ['admin', 'manager', 'cashier'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Reports',
      href: '/reports',
      roles: ['admin', 'manager', 'viewer'],
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const hasAccess = (item: NavItem): boolean => {
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  };

  const isCurrentPath = (href: string): boolean => {
    return router.pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm border-r border-gray-200 z-20">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigationItems
            .filter(hasAccess)
            .map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isCurrentPath(item.href)
                      ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>
              </li>
            ))}
        </ul>

        {/* User Role Info */}
        {currentUser && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="px-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Current Role
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
