import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ShiftModal } from './components/ShiftModal.tsx';
import { IdleTimerModal } from './components/IdleTimerModal.tsx';
import { useIdleTimer } from './hooks/useIdleTimer.ts';
import { ActiveTab } from './components/TopNavbar.tsx';

// Direct component imports to ensure single React instance and avoid lazy chunk skews
import PosPage from './pages/PosPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import LoginHistoryPage from './pages/LoginHistoryPage.tsx';
import ActiveTokensPage from './pages/ActiveTokensPage.tsx';
import ChangePasswordPage from './pages/ChangePasswordPage.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import AdminProductsPage from './pages/AdminProductsPage.tsx';
import AdminCategoriesPage from './pages/AdminCategoriesPage.tsx';
import OrderHistoryPage from './pages/OrderHistoryPage.tsx';
import TenantsPage from './pages/TenantsPage.tsx';
import UsersPage from './pages/UsersPage.tsx';
import StoreSettingsPage from './pages/StoreSettingsPage.tsx';
import AdminDeactivationRequestsPage from './pages/AdminDeactivationRequestsPage.tsx';

const AppContent: React.FC = () => {
  const { user, loading, logout, idleTimeoutMinutes } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    return user?.role === 'ADMIN' ? 'tenants' : 'pos';
  });
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [adminDrillTenantId, setAdminDrillTenantId] = useState<string>('ALL');
  const [adminDrillCategory, setAdminDrillCategory] = useState<string>('Semua Produk');

  // Automatically switch tab if user role changes or is ADMIN trying to access POS
  React.useEffect(() => {
    if (user?.role === 'ADMIN' && currentTab === 'pos') {
      setCurrentTab('tenants');
    }
  }, [user?.role, currentTab]);

  // Inactivity auto-logout hook based on IDLE_TIMEOUT_MINUTES from .env
  const { showWarning, secondsRemaining, resetTimer } = useIdleTimer({
    timeoutMinutes: idleTimeoutMinutes || 5,
    onTimeout: () => {
      logout();
    },
    warningSeconds: 30,
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A1F] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono tracking-wider">
            MEMUAT KASIR WARUNG...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const defaultHomeTab: ActiveTab = user.role === 'ADMIN' ? 'tenants' : 'pos';

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'tenants':
        return (
          <TenantsPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'admin-products':
        return (
          <AdminProductsPage
            onNavigate={setCurrentTab}
            initialTenantId={adminDrillTenantId}
            initialCategory={adminDrillCategory}
          />
        );
      case 'admin-categories':
        return (
          <AdminCategoriesPage
            onNavigate={setCurrentTab}
            onFilterTenantProducts={(tId, catName) => {
              setAdminDrillTenantId(tId);
              setAdminDrillCategory(catName);
              setCurrentTab('admin-products');
            }}
          />
        );
      case 'cashiers':
        return (
          <UsersPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'store-settings':
        return (
          <StoreSettingsPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'deactivation-requests':
        return (
          <AdminDeactivationRequestsPage
            onNavigate={setCurrentTab}
          />
        );
      case 'products':
        if (user?.role === 'ADMIN') {
          return (
            <AdminProductsPage
              onNavigate={setCurrentTab}
              initialTenantId={adminDrillTenantId}
              initialCategory={adminDrillCategory}
            />
          );
        }
        return (
          <ProductsPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'categories':
        if (user?.role === 'ADMIN') {
          return (
            <AdminCategoriesPage
              onNavigate={setCurrentTab}
              onFilterTenantProducts={(tId, catName) => {
                setAdminDrillTenantId(tId);
                setAdminDrillCategory(catName);
                setCurrentTab('admin-products');
              }}
            />
          );
        }
        return (
          <CategoriesPage
            onNavigate={setCurrentTab}
            onFilterCategory={() => setCurrentTab('products')}
          />
        );
      case 'history':
        return (
          <OrderHistoryPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onOpenSwitchShift={() => setIsShiftModalOpen(true)}
            onNavigate={setCurrentTab}
          />
        );
      case 'login-history':
        return (
          <LoginHistoryPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'active-tokens':
        return (
          <ActiveTokensPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'change-password':
        return (
          <ChangePasswordPage
            onNavigate={setCurrentTab}
          />
        );
      case 'pos':
      default:
        // Role ADMIN tidak bisa akses halaman order/pos, arahkan ke tenants
        if (user?.role === 'ADMIN') {
          return (
            <TenantsPage
              onBackToPos={() => setCurrentTab('tenants')}
              onNavigate={setCurrentTab}
            />
          );
        }
        return <PosPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6F8] font-sans">
      {/* Dark Sidebar with direct page navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        onOpenSettings={() => setIsShiftModalOpen(true)}
        onLogout={logout}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {renderCurrentPage()}
      </div>

      {/* Shift Switch Handover Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onLogout={logout}
      />

      {/* Idle Timer Auto-logout Warning Modal */}
      <IdleTimerModal
        isOpen={showWarning}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={resetTimer}
        onLogoutNow={logout}
      />
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds fresh cache
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

