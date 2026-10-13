import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, api, tokenStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCashier: (email: string) => Promise<void>;
  idleTimeoutMinutes: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(tokenStorage.getUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState<number>(5);

  useEffect(() => {
    async function initAuth() {
      const storedToken = tokenStorage.getAccessToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            if (res.data.idleTimeoutMinutes) {
              setIdleTimeoutMinutes(res.data.idleTimeoutMinutes);
            }
          }
        } catch {
          // Token expired or invalid
          tokenStorage.clearSession();
          setUser(null);
        }
      } else {
        // Auto-bootstrap default cashier session (Budi Santoso) to match image
        try {
          const res = await api.switchCashier('budi@kasirwarung.id');
          if (res.success && res.data?.user) {
            tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
            setUser(res.data.user);
            if (res.data.idleTimeoutMinutes) {
              setIdleTimeoutMinutes(res.data.idleTimeoutMinutes);
            }
          }
        } catch (err) {
          console.warn('Auto-session bootstrap note:', err);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
      if (res.data.idleTimeoutMinutes) {
        setIdleTimeoutMinutes(res.data.idleTimeoutMinutes);
      }
    }
  };

  const register = async (name: string, email: string, password: string, role = 'kasir') => {
    const res = await api.register(name, email, password, role);
    if (res.success && res.data) {
      tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefreshToken() || undefined;
    try {
      await api.logout(refresh);
    } catch {
      // Ignore
    } finally {
      tokenStorage.clearSession();
      setUser(null);
    }
  };

  const switchCashier = async (email: string) => {
    const res = await api.switchCashier(email);
    if (res.success && res.data) {
      tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      setUser(res.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        switchCashier,
        idleTimeoutMinutes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
