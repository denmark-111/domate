import { createClient } from '@supabase/supabase-js';
import { envConfig } from './envConfig.js';

const supabaseUrl = envConfig.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envConfig.supabaseAnonKey || 'placeholder-key';

export const isSupabaseConfigured = Boolean(envConfig.supabaseUrl && envConfig.supabaseAnonKey && envConfig.isValid);

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables are missing or misconfigured. Frontend fallback active.', envConfig.errors);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
  },
});

