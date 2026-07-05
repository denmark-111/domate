import { supabase } from '../lib/supabaseClient.js';

const safeError = (error) => error?.message || 'Authentication failed';

export const authService = {
  async signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { success: false, error: safeError(error) };
    return { success: true, data };
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: safeError(error) };
    return { success: true, data };
  },

  async signInWithProvider(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });

    if (error) return { success: false, error: safeError(error) };
    return { success: true };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: safeError(error) };
    return { success: true };
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) return { success: false, error: safeError(error) };
    return { success: true };
  },

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { success: false, error: safeError(error) };
    return { success: true };
  },
};