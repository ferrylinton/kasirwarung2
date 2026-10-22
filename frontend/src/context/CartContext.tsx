import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, OrderItem, Order, api } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';
import {
  useSavedOrders,
  useSaveOrCheckoutOrderMutation,
  useDeleteSavedOrderMutation,
  useCurrentTenant,
} from '../hooks/useQueries.ts';

interface CartContextType {
  invoiceNo: string;
  items: OrderItem[];
  savedOrders: Order[];
  savedOrdersCount: number;
  subtotal: number;
  tax: number;
  taxEnabled: boolean;
  taxRate: number;
  taxType: 'percentage' | 'fixed';
  total: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  addItem: (product: Product, qtyDelta?: number) => void;
  setItemQty: (productId: string, qty: number, product?: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  startNewTransaction: () => void;
  saveCurrentOrder: () => Promise<boolean>;
  resumeOrder: (order: Order) => void;
  deleteSavedOrder: (invoiceNo: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  findItemQty: (productId: string) => number;
  isMobileCartOpen: boolean;
  setIsMobileCartOpen: (open: boolean) => void;
  openMobileCart: () => void;
  closeMobileCart: () => void;
  toggleMobileCart: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Initial items to match the exact cart screenshot:
// Indomie x5 (@Rp3.500) = Rp17.500
// Ultra Milk x2 (@Rp7.500) = Rp15.000
// Minyak Sania x1 (@Rp38.000) = Rp38.000
// Chitato x1 (@Rp11.500) = Rp11.500
// Subtotal = Rp82.000, PPN (11%) = Rp9.020, Total = Rp91.020
const INITIAL_DEMO_ITEMS: OrderItem[] = [
  {
    productId: 'KW-IND-001',
    name: 'Indomie Goreng Spesial',
    price: 3500,
    qty: 5,
    iconType: 'noodle',
    bgTint: '#FDF8EE',
    iconColor: '#F59E0B',
  },
  {
    productId: 'KW-ULT-003',
    name: 'Ultra Milk Cokelat 250ml',
    price: 7500,
    qty: 2,
    iconType: 'milk',
    bgTint: '#FDF8EE',
    iconColor: '#9A3412',
  },
  {
    productId: 'KW-MNY-004',
    name: 'Minyak Goreng Sania 2L',
    price: 38000,
    qty: 1,
    iconType: 'oil',
    bgTint: '#FCFCEB',
    iconColor: '#CA8A04',
  },
  {
    productId: 'KW-CHT-005',
    name: 'Chitato Sapi Panggang 68g',
    price: 11500,
    qty: 1,
    iconType: 'chips',
    bgTint: '#FDF3EB',
    iconColor: '#EA580C',
  },
];

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [invoiceNo, setInvoiceNo] = useState<string>('INV/2025/05/28-0042');
  const [items, setItems] = useState<OrderItem[]>(() => {
    return user?.role === 'ADMIN' ? [] : INITIAL_DEMO_ITEMS;
  });
  const [customerName, setCustomerName] = useState<string>('Pelanggan Umum');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setItems([]);
    }
  }, [user]);

  // TanStack Query for saved orders
  const { data: savedOrdersData, refetch: refreshOrders } = useSavedOrders({
    enabled: !!user && user.role !== 'ADMIN',
  });
  const savedOrders = savedOrdersData?.data || [];

  // TanStack Mutations
  const saveOrderMutation = useSaveOrCheckoutOrderMutation();
  const deleteSavedOrderMutation = useDeleteSavedOrderMutation();

  const openMobileCart = () => setIsMobileCartOpen(true);
  const closeMobileCart = () => setIsMobileCartOpen(false);
  const toggleMobileCart = () => setIsMobileCartOpen((prev) => !prev);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

  const findItemQty = (productId: string): number => {
    const found = items.find((i) => i.productId === productId || i.name === productId);
    return found ? found.qty : 0;
  };

  const addItem = (product: Product, qtyDelta = 1) => {
    if (user?.role === 'ADMIN') return;
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id || i.productId === product.sku || i.name === product.name
      );
      if (existingIdx >= 0) {
        const nextQty = prev[existingIdx].qty + qtyDelta;
        if (nextQty <= 0) {
          return prev.filter((_, idx) => idx !== existingIdx);
        }
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, qty: nextQty } : item
        );
      }
      if (qtyDelta <= 0) return prev;
      return [
        ...prev,
        {
          productId: product.id || product.sku,
          name: product.name,
          price: product.price,
          qty: qtyDelta,
          iconType: product.iconType,
          bgTint: product.bgTint,
          iconColor: product.iconColor,
        },
      ];
    });
  };

  const setItemQty = (productId: string, qty: number, product?: Product) => {
    if (user?.role === 'ADMIN') return;
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === productId || (product && i.name === product.name)
      );
      if (qty <= 0) {
        return prev.filter((_, idx) => idx !== existingIdx);
      }
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, qty } : item
        );
      }
      if (!product) return prev;
      return [
        ...prev,
        {
          productId: product.id || product.sku,
          name: product.name,
          price: product.price,
          qty,
          iconType: product.iconType,
          bgTint: product.bgTint,
          iconColor: product.iconColor,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId && i.name !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const startNewTransaction = async () => {
    try {
      const res = await api.getNextInvoice();
      if (res.success && res.invoiceNo) {
        setInvoiceNo(res.invoiceNo);
      } else {
        const randomSeq = Math.floor(1000 + Math.random() * 9000);
        setInvoiceNo(`INV/2025/05/28-${randomSeq}`);
      }
    } catch {
      setInvoiceNo(`INV/2025/05/28-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    clearCart();
    setCustomerName('Pelanggan Umum');
  };

  const saveCurrentOrder = async (): Promise<boolean> => {
    if (user?.role === 'ADMIN' || items.length === 0) return false;
    try {
      await saveOrderMutation.mutateAsync({
        invoiceNo,
        status: 'saved',
        items,
        customerName,
      });
      await startNewTransaction();
      return true;
    } catch (err) {
      console.error('Failed to save order:', err);
      return false;
    }
  };

  const resumeOrder = (order: Order) => {
    setInvoiceNo(order.invoiceNo);
    setItems(order.items || []);
    setCustomerName(order.customerName || 'Pelanggan Umum');
  };

  const deleteSavedOrder = async (inv: string) => {
    try {
      await deleteSavedOrderMutation.mutateAsync(inv);
    } catch (err) {
      console.error('Failed to delete saved order:', err);
    }
  };

  const { data: tenantData } = useCurrentTenant({ enabled: !!user && user.role !== 'ADMIN' });
  const tenant = tenantData?.data;
  const taxEnabled = tenant?.taxEnabled !== undefined ? Boolean(tenant.taxEnabled) : true;
  const taxRate = typeof tenant?.taxRate === 'number' ? tenant.taxRate : 11;
  const taxType = tenant?.taxType || 'percentage';

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  let tax = 0;
  if (taxEnabled && subtotal > 0) {
    if (taxType === 'fixed') {
      tax = Math.round(taxRate);
    } else {
      tax = Math.round(subtotal * (taxRate / 100));
    }
  }
  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        invoiceNo,
        items,
        savedOrders,
        savedOrdersCount: savedOrders.length,
        subtotal,
        tax,
        taxEnabled,
        taxRate,
        taxType,
        total,
        customerName,
        setCustomerName,
        addItem,
        setItemQty,
        removeItem,
        clearCart,
        startNewTransaction,
        saveCurrentOrder,
        resumeOrder,
        deleteSavedOrder,
        refreshOrders: async () => {
          await refreshOrders();
        },
        findItemQty,
        isMobileCartOpen,
        setIsMobileCartOpen,
        openMobileCart,
        closeMobileCart,
        toggleMobileCart,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
