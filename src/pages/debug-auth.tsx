import React from 'react';
import { useCurrentUser, useAuth } from '../hooks/useAuth';

export default function DebugAuth() {
  const currentUserQuery = useCurrentUser();
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* useCurrentUser Debug */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">useCurrentUser()</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {currentUserQuery.isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {currentUserQuery.error ? currentUserQuery.error.message : 'None'}</p>
              <p><strong>Data:</strong> {currentUserQuery.data ? 'Present' : 'None'}</p>
              {currentUserQuery.data && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <pre className="text-sm">{JSON.stringify(currentUserQuery.data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* useAuth Debug */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">useAuth()</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {auth.isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {auth.error ? auth.error.message : 'None'}</p>
              <p><strong>Is Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {auth.user ? auth.user.full_name : 'None'}</p>
              <p><strong>Session:</strong> {auth.session ? auth.session.email : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Login Test</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={async () => {
              const { supabase } = await import('../lib/supabase');
              try {
                const result = await supabase.auth.signInWithPassword({
                  email: 'manager@fuji.com',
                  password: 'manager123'
                });
                console.log('Login result:', result);
                window.location.reload();
              } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: ' + error.message);
              }
            }}
          >
            Test Login (manager@fuji.com)
          </button>
        </div>
      </div>
    </div>
  );
}