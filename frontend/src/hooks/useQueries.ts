import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  Product,
  Category,
  Order,
  Tenant,
  Cashier,
  DeactivationRequestItem,
} from '../services/api.ts';

// Centralized Query Keys for TanStack Query cache invalidation & management
export const queryKeys = {
  products: (search = '', category = '', tenantId = '') =>
    ['products', { search, category, tenantId }] as const,
  categories: (tenantId = '') => ['categories', { tenantId }] as const,
  ordersHistory: (tenantId = '', startDate = '', endDate = '') =>
    ['orders-history', { tenantId, startDate, endDate }] as const,
  savedOrders: () => ['orders-saved'] as const,
  reportSummary: () => ['report-summary'] as const,
  tenants: () => ['tenants'] as const,
  currentTenant: () => ['current-tenant'] as const,
  cashiers: () => ['cashiers'] as const,
  loginHistory: () => ['login-history'] as const,
  deactivationRequests: () => ['deactivation-requests'] as const,
  health: () => ['health'] as const,
};

// 1. Order History Query (used by HistoryPage)
export function useOrderHistory(
  tenantId?: string,
  startDate?: string,
  endDate?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<{
    success: boolean;
    data: Order[];
    retentionPolicy?: string;
    earliestAllowedDate?: string;
  }>({
    queryKey: queryKeys.ordersHistory(tenantId || '', startDate || '', endDate || ''),
    queryFn: async () => {
      const res = await api.getOrderHistory(tenantId, startDate, endDate);
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 15,
  });
}

// 2. Report Summary Query (used by ReportPage)
export function useReportSummary() {
  return useQuery<{
    success: boolean;
    data: {
      totalRevenue: number;
      totalTax?: number;
      totalTransactions?: number;
      savedOrdersCount?: number;
      totalProducts?: number;
      recentPaidCount?: number;
      totalOrders?: number;
      totalItemsSold?: number;
      lowStockCount?: number;
      todayRevenue?: number;
      todayOrders?: number;
      recentOrders?: Order[];
      topSelling?: { name: string; qty: number; revenue: number }[];
    };
  }>({
    queryKey: queryKeys.reportSummary(),
    queryFn: async () => {
      const res = await api.getReportSummary();
      return res;
    },
    staleTime: 1000 * 30,
  });
}

// 3. Products Query (used by PosPage, ProductsPage, AdminProductsPage)
export function useProducts(
  searchQuery = '',
  category = 'Semua Produk',
  tenantId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery<{ success: boolean; data: Product[] }>({
    queryKey: queryKeys.products(searchQuery, category, tenantId || ''),
    queryFn: async () => {
      const res = await api.getProducts(searchQuery, category, tenantId);
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
}

// 4. Categories Query (used by CategoriesPage, PosPage, AdminCategoriesPage)
export function useCategories(tenantId?: string, options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: Category[] }>({
    queryKey: queryKeys.categories(tenantId || ''),
    queryFn: async () => {
      const res = await api.getCategories(tenantId);
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

// 5. Saved Orders Query (used by CartContext / POS)
export function useSavedOrders(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: Order[] }>({
    queryKey: queryKeys.savedOrders(),
    queryFn: async () => {
      const res = await api.getSavedOrders();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 10,
  });
}

// 6. Tenants Query (used by TenantsPage, Admin views)
export function useTenants(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: Tenant[] }>({
    queryKey: queryKeys.tenants(),
    queryFn: async () => {
      const res = await api.getTenants();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

// 7. Current Tenant Query (used by StoreSettingsPage)
export function useCurrentTenant(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: Tenant }>({
    queryKey: queryKeys.currentTenant(),
    queryFn: async () => {
      const res = await api.getCurrentTenant();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

// 8. Cashiers Query (used by CashiersPage)
export function useCashiers(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: Cashier[] }>({
    queryKey: queryKeys.cashiers(),
    queryFn: async () => {
      const res = await api.getCashiers();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
}

// 9. Login History Query (used by LoginHistoryPage)
export function useLoginHistory(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: any[] }>({
    queryKey: queryKeys.loginHistory(),
    queryFn: async () => {
      const res = await api.getLoginHistory();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
}

// 10. Deactivation Requests Query (used by DeactivationRequests component)
export function useDeactivationRequests(options?: { enabled?: boolean }) {
  return useQuery<{ success: boolean; data: DeactivationRequestItem[] }>({
    queryKey: queryKeys.deactivationRequests(),
    queryFn: async () => {
      const res = await api.getDeactivationRequests();
      return res;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
}

// === TanStack Mutations with Automatic Cache Invalidation ===

export function useCleanupOldOrdersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.runOldOrdersCleanup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-history'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportSummary() });
    },
  });
}

export function useSaveOrCheckoutOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData: any) => api.createOrSaveOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-history'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportSummary() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteSavedOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceNo: string) => api.deleteSavedOrder(invoiceNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOrders() });
    },
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (data: any) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportSummary() });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportSummary() });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportSummary() });
    },
  });

  return { createProduct, updateProduct, deleteProduct };
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: (data: any) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
}

export function useCashierMutations() {
  const queryClient = useQueryClient();

  const createCashier = useMutation({
    mutationFn: (data: any) => api.createCashier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashiers() });
    },
  });

  const updateCashier = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCashier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashiers() });
    },
  });

  const deleteCashier = useMutation({
    mutationFn: (id: string) => api.deleteCashier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashiers() });
    },
  });

  return { createCashier, updateCashier, deleteCashier };
}
