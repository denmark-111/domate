import { supabase } from '../lib/supabaseClient.js';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
  };

  const token = data?.session?.access_token;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const baseHeaders = await getAuthHeaders();

  const mergedHeaders = {
    ...baseHeaders,
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData) {
    delete mergedHeaders['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => null);
    let message = `API error: ${response.status} ${response.statusText}`;
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (parsed.message) message = parsed.message;
      } catch {
        // ignore parse failures, fall back to default message
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    const result = JSON.parse(text);
    return result?.data ?? result;
  } catch {
    // If response isn't valid JSON, return raw text fallback
    return text;
  }
};