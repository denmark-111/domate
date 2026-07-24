import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/index.js';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext();

const fetchUserProfile = async (session) => {
  try {
    const res = await profileService.getProfile();
    if (!res.success) return null;
    return {
      ...res.data,
      provider: session.user?.app_metadata?.provider || 'email',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (data?.session) {
          const profile = await fetchUserProfile(data.session);
          if (!mounted) return;

          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          } else {
            // Fallback to session data if profile fetch fails
            const currentUser = data.session.user;
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              fullName: currentUser.user_metadata?.full_name || currentUser.email,
              provider: currentUser.app_metadata?.provider || 'email',
            });
            setIsAuthenticated(true);
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

      if (event === 'INITIAL_SESSION') {
        // Handled by getSession above to avoid duplicate profile fetches
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session);
        if (!mounted) return;

        if (profile) {
          setUser(profile);
          setIsAuthenticated(true);
        } else {
          // Fallback
          setUser({
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email,
            provider: session.user.app_metadata?.provider || 'email',
          });
          setIsAuthenticated(true);
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
    const profile = await fetchUserProfile(session);
    let userData;

    if (profile) {
      userData = profile;
    } else {
      const sessionUser = session.user;
      userData = {
        id: sessionUser.id,
        email: sessionUser.email,
        fullName: sessionUser.user_metadata?.full_name || sessionUser.email,
        provider: sessionUser.app_metadata?.provider || 'email',
      };
    }

    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    return { success: true, user: userData };
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
