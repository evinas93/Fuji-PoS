import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testSupabase() {
      try {
        console.log('Testing Supabase connection...');

        // Test basic connection
        const { data, error } = await supabase.from('users').select('count').limit(1);

        if (error) {
          setError(`Database error: ${error.message}`);
          setStatus('❌ Database connection failed');
        } else {
          setStatus('✅ Supabase connection successful');
        }
      } catch (err) {
        setError(`Connection error: ${err}`);
        setStatus('❌ Connection failed');
      }
    }

    testSupabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p>
          <strong>Status:</strong> {status}
        </p>
        {error && (
          <p className="text-red-600">
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <ul className="list-disc list-inside">
          <li>
            NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}
          </li>
          <li>
            NEXT_PUBLIC_SUPABASE_ANON_KEY:{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
          </li>
        </ul>
      </div>
    </div>
  );
}
