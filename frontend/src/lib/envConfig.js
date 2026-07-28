/**
 * Central Environment Variable Configuration & Validation
 */

const DEFAULT_API_URL = 'http://localhost:8000/api';

/**
 * Validates a URL string format.
 */

const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Gets and sanitizes the API base URL.
 */
export const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL;
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return DEFAULT_API_URL;
  }

  const trimmed = rawUrl.trim();
  // Strip trailing slashes
  return trimmed.replace(/\/+$/, '');
};

/**
 * Returns environment configuration status and any detected issues.
 */
export const validateEnvConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const rawApiUrl = import.meta.env.VITE_API_URL;

  const errors = [];

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is missing in environment variables.');
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push(`VITE_SUPABASE_URL ("${supabaseUrl}") is not a valid HTTP/HTTPS URL.`);
  }

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing in environment variables.');
  }

  if (rawApiUrl && !isValidUrl(rawApiUrl)) {
    errors.push(`VITE_API_URL ("${rawApiUrl}") is not a valid HTTP/HTTPS URL.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    supabaseUrl,
    supabaseAnonKey,
    apiBaseUrl: getApiBaseUrl()
  };
};

export const envConfig = validateEnvConfig();
