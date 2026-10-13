export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shift?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  iconType: string;
  bgTint: string;
  iconColor: string;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  iconType?: string;
  bgTint?: string;
  iconColor?: string;
}

export interface Order {
  id: string;
  invoiceNo: string;
  status: 'saved' | 'paid' | 'cancelled';
  timeLabel: string;
  summaryLabel?: string;
  customerName?: string;
  cashierName?: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashReceived?: number;
  changeAmount?: number;
  createdAt?: string;
}

const ACCESS_KEY = 'kw_access_token';
const REFRESH_KEY = 'kw_refresh_token';
const USER_KEY = 'kw_user';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = tokenStorage.getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(endpoint, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken && !endpoint.includes('/api/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            const newAccess = refreshData.data.accessToken;
            const newRefresh = refreshData.data.refreshToken || refreshToken;
            const currentUser = tokenStorage.getUser();
            if (currentUser) {
              tokenStorage.setSession(newAccess, newRefresh, currentUser);
            }
            isRefreshing = false;
            onRefreshed(newAccess);
            // Retry original request
            headers.set('Authorization', `Bearer ${newAccess}`);
            const retryRes = await fetch(endpoint, { ...options, headers });
            return await retryRes.json();
          } else {
            tokenStorage.clearSession();
            isRefreshing = false;
          }
        } catch {
          tokenStorage.clearSession();
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh
        return new Promise((resolve) => {
          refreshSubscribers.push(async (newToken) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryRes = await fetch(endpoint, { ...options, headers });
            resolve(await retryRes.json());
          });
        });
      }
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, role = 'kasir') =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),
  logout: (refreshToken?: string) =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  getMe: () => apiRequest('/api/auth/me'),
  switchCashier: (email: string) =>
    apiRequest('/api/auth/switch-cashier', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getLoginHistory: () => apiRequest('/api/auth/login-history'),

  // Products
  getProducts: (search = '', category = 'Semua Produk') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'Semua Produk') params.set('category', category);
    return apiRequest(`/api/products?${params.toString()}`);
  },
  createProduct: (productData: any) =>
    apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  updateProduct: (id: string, productData: any) =>
    apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id: string) =>
    apiRequest(`/api/products/${id}`, { method: 'DELETE' }),

  // Orders
  getSavedOrders: () => apiRequest('/api/orders/saved'),
  getOrderHistory: () => apiRequest('/api/orders/history'),
  getNextInvoice: () => apiRequest('/api/orders/next-invoice'),
  createOrSaveOrder: (orderData: any) =>
    apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  deleteSavedOrder: (invoiceNo: string) =>
    apiRequest(`/api/orders/saved/${encodeURIComponent(invoiceNo)}`, {
      method: 'DELETE',
    }),

  // Reports
  getReportSummary: () => apiRequest('/api/reports/summary'),
  getHealth: () => apiRequest('/api/health'),
};
