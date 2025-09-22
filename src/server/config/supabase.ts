// Supabase client configuration for server-side operations
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

const env = getEnv();

// Create Supabase client with service role key for server operations
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'fuji-pos-server/1.0.0',
      },
    },
  }
);

// Create a client for user-specific operations (with RLS)
export const createSupabaseClient = (accessToken?: string) => {
  const client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'fuji-pos-client/1.0.0',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      },
    }
  );

  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });
  }

  return client;
};

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);

    return !error && data !== null;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Get system settings
export const getSystemSettings = async (): Promise<Record<string, string>> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.error('Failed to fetch system settings:', error);
      return {};
    }

    return data.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {};
  }
};

// Get system setting by key
export const getSystemSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    return data.value;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
    return null;
  }
};

// Update system setting
export const updateSystemSetting = async (
  key: string, 
  value: string,
  updatedBy?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_by: updatedBy || null,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (error) {
    console.error(`Error updating system setting ${key}:`, error);
    return false;
  }
};

