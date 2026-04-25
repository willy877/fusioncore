import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.fusioncore.space';

const AuthContext = createContext(undefined);

const getStoredTokens = () => ({
  access: localStorage.getItem('fc_access_token'),
  refresh: localStorage.getItem('fc_refresh_token'),
});

const setStoredTokens = (access, refresh) => {
  if (access) localStorage.setItem('fc_access_token', access);
  if (refresh) localStorage.setItem('fc_refresh_token', refresh);
};

const clearStoredTokens = () => {
  localStorage.removeItem('fc_access_token');
  localStorage.removeItem('fc_refresh_token');
  localStorage.removeItem('fc_user');
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intenta refrescar o cargar sesión al iniciar
  useEffect(() => {
    const init = async () => {
      const { access, refresh } = getStoredTokens();
      if (!access && !refresh) { setLoading(false); return; }

      try {
        // Intentar con access token primero
        if (access) {
          const res = await fetch(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${access}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setSession({ access_token: access, refresh_token: refresh });
            setLoading(false);
            return;
          }
        }

        // Si expiró, refrescar
        if (refresh) {
          const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
          });
          if (res.ok) {
            const data = await res.json();
            setStoredTokens(data.access_token, data.refresh_token);

            const profileRes = await fetch(`${API_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${data.access_token}` },
            });
            if (profileRes.ok) {
              const userData = await profileRes.json();
              setUser(userData);
              setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
            }
          } else {
            clearStoredTokens();
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
        clearStoredTokens();
      }
      setLoading(false);
    };
    init();
  }, []);

  const signUp = useCallback(async (email, password, options) => {
    const username = options?.data?.username || email.split('@')[0];
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Error al registrarse', description: data.error });
        return { error: data };
      }
      setStoredTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      toast({ title: 'Cuenta creada', description: `Bienvenido, ${data.user.username}!` });
      return { error: null };
    } catch (err) {
      const error = { message: 'Error de conexión' };
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return { error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Error al iniciar sesión', description: data.error });
        return { error: data };
      }
      setStoredTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      return { error: null };
    } catch (err) {
      const error = { message: 'Error de conexión' };
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return { error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    const { access } = getStoredTokens();
    if (access) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${access}` },
        });
      } catch {}
    }
    clearStoredTokens();
    setUser(null);
    setSession(null);
    return { error: null };
  }, []);

  // Stubs para compatibilidad con páginas existentes
  const sendPasswordResetEmail = useCallback(async () => ({ error: null }), []);
  const updateUserPassword = useCallback(async () => ({ error: null }), []);
  const signInWithGoogle = useCallback(async () => {
    toast({ title: 'Google login no disponible', description: 'Usa email y contraseña.' });
    return { error: { message: 'Not available' } };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updateUserPassword,
    signInWithGoogle,
  }), [user, session, loading, signUp, signIn, signOut, sendPasswordResetEmail, updateUserPassword, signInWithGoogle]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
