import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/index.js';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext();

const fetchUserProfile = async (session) => {
  const res = await profileService.getProfile();
  if (!res.success) throw new Error('Profile fetch failed');
  return {
    ...res.data,
    provider: session.user?.app_metadata?.provider || 'email',
  };
};

const SESSION_TIMEOUT_MS = 5000;

const getSessionWithTimeout = () => {
  const sessionPromise = supabase.auth.getSession();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Session restore timed out')), SESSION_TIMEOUT_MS)
  );
  return Promise.race([sessionPromise, timeoutPromise]);
};

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await getSessionWithTimeout();
        
        if (error) {
          if (error.status >= 400 && error.status < 500) {
            throw error;
          } else {
            console.warn('Non-auth error during session restore:', error);
          }
        }

        if (data?.session) {
          try {
            const profile = await fetchUserProfile(data.session);
            if (!mounted) return;
            setUser(profile);
            setIsAuthenticated(true);
          } catch (profileError) {
            console.error('Profile fetch failed, signing out:', profileError);
            if (!mounted) return;
            await supabase.auth.signOut().catch(() => {});
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        return;
      }

      if (session?.user) {
        try {
          const profile = await fetchUserProfile(session);
          if (!mounted) return;
          setUser(profile);
          setIsAuthenticated(true);
        } catch (profileError) {
          console.error('Profile fetch failed during auth event, signing out:', profileError);
          if (!mounted) return;
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    const result = await authService.signIn({ email, password });
    if (!result.success) {
      setIsLoading(false);
      return result;
    }

    const session = result.data.session;
    try {
      const profile = await fetchUserProfile(session);
      setUser(profile);
      setIsAuthenticated(true);
    } catch (profileError) {
      console.error('Profile fetch failed after login, signing out:', profileError);
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return { success: false, error: 'Failed to load user profile. Please try again.' };
    }

    setIsLoading(false);
    return { success: true, user };
  };

  const register = async (fullName, email, password) => {
    setIsLoading(true);
    const result = await authService.signUp({ email, password, fullName });
    setIsLoading(false);
    return result;
  };

  const loginWithOAuth = async (provider) => {
    setIsLoading(true);
    const result = await authService.signInWithProvider(provider);
    setIsLoading(false);
    return result;
  };

  const sendPasswordReset = async (email) => {
    return await authService.resetPassword(email);
  };

  const updatePassword = async (password) => {
    return await authService.updatePassword(password);
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      const result = await authService.signOut();

      if (!result.success) {
        return result;
      }

      setUser(null);
      setIsAuthenticated(false);

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated,
        login,
        register,
        loginWithOAuth,
        logout,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
