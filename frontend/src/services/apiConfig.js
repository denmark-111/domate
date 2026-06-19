import { supabase } from '../lib/supabaseClient.js';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${data?.session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

export const apiCall = async (endpoint, options = {}) => {
  const headers = await getAuthHeaders();
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  const result = await response.json();
  return result.data || result;
};
