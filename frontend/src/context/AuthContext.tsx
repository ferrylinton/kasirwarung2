import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, api, tokenStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerTenant: (data: { shopName: string; ownerEmail: string; username: string; password: string }) => Promise<any>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchCashier: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  idleTimeoutMinutes: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(tokenStorage.getUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState<number>(5);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        const currentToken = tokenStorage.getAccessToken() || '';
        const currentRefresh = tokenStorage.getRefreshToken() || '';
        tokenStorage.setSession(currentToken, currentRefresh, res.data.user);
        if (res.data.idleTimeoutMinutes) {
          setIdleTimeoutMinutes(res.data.idleTimeoutMinutes);
        }
      }
    } catch {
      // Ignored
    }
  };

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
          } else {
            tokenStorage.clearSession();
            setUser(null);
          }
        } catch {
          // Token expired or invalid
          tokenStorage.clearSession();
          setUser(null);
        }
      } else {
        setUser(null);
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

  const registerTenant = async (data: { shopName: string; ownerEmail: string; username: string; password: string }) => {
    const res = await api.registerTenant(data);
    return res;
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
        registerTenant,
        register,
        logout,
        switchCashier,
        refreshUser,
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
