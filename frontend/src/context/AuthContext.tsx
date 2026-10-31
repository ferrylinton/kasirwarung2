import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, api, tokenStorage } from '../services/api.ts';
import { UserRole, ADMIN, SHOP_OWNER, SHOP_CASHIER } from '../constants/roles.ts';

interface AuthContextType {
  user: User | null;
  tenantId: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerTenant: (data: { shopName: string; ownerEmail: string; username: string; password: string }) => Promise<any>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchCashier: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  idleTimeoutMinutes: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to resolve tenantId:
// untuk role SHOP_OWNER dan SHOP_CASHIER data tenantId diambil dari data user
// untuk role ADMIN buat tenantId = 'ALL'
const resolveUserWithTenantId = (u: User | null): User | null => {
  if (!u) return null;
  if (u.role === ADMIN) {
    return { ...u, tenantId: 'ALL' };
  }
  return u;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => resolveUserWithTenantId(tokenStorage.getUser()));
  const [loading, setLoading] = useState<boolean>(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState<number>(5);

  // Computes current tenantId based on user role
  const tenantId: string = user?.role === ADMIN
    ? 'ALL'
    : (user?.role === SHOP_OWNER || user?.role === SHOP_CASHIER)
      ? (user?.tenantId || '')
      : (user?.tenantId || '');

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        const resolvedUser = resolveUserWithTenantId(res.data.user);
        setUser(resolvedUser);
        const currentToken = tokenStorage.getAccessToken() || '';
        const currentRefresh = tokenStorage.getRefreshToken() || '';
        if (resolvedUser) {
          tokenStorage.setSession(currentToken, currentRefresh, resolvedUser);
        }
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
            const resolvedUser = resolveUserWithTenantId(res.data.user);
            setUser(resolvedUser);
            if (resolvedUser) {
              const currentRefresh = tokenStorage.getRefreshToken() || '';
              tokenStorage.setSession(storedToken, currentRefresh, resolvedUser);
            }
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
      const resolvedUser = resolveUserWithTenantId(res.data.user);
      if (resolvedUser) {
        tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, resolvedUser);
      }
      setUser(resolvedUser);
      if (res.data.idleTimeoutMinutes) {
        setIdleTimeoutMinutes(res.data.idleTimeoutMinutes);
      }
    }
  };

  const registerTenant = async (data: { shopName: string; ownerEmail: string; username: string; password: string }) => {
    const res = await api.registerTenant(data);
    return res;
  };

  const register = async (name: string, email: string, password: string, role: UserRole = SHOP_CASHIER) => {
    const res = await api.register(name, email, password, role);
    if (res.success && res.data) {
      const resolvedUser = resolveUserWithTenantId(res.data.user);
      if (resolvedUser) {
        tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, resolvedUser);
      }
      setUser(resolvedUser);
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
      const resolvedUser = resolveUserWithTenantId(res.data.user);
      if (resolvedUser) {
        tokenStorage.setSession(res.data.accessToken, res.data.refreshToken, resolvedUser);
      }
      setUser(resolvedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantId,
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
