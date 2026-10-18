import React, { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ShiftModal } from './components/ShiftModal.tsx';
import { IdleTimerModal } from './components/IdleTimerModal.tsx';
import { useIdleTimer } from './hooks/useIdleTimer.ts';
import { ActiveTab } from './components/TopNavbar.tsx';

// React Lazy Loading untuk semua halaman aplikasi
const PosPage = lazy(() => import('./pages/PosPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const ReportPage = lazy(() => import('./pages/ReportPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const LoginHistoryPage = lazy(() => import('./pages/LoginHistoryPage.tsx'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage.tsx'));
const ProductsPage = lazy(() => import('./pages/ProductsPage.tsx'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.tsx'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage.tsx'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage.tsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.tsx'));
const TenantsPage = lazy(() => import('./pages/TenantsPage.tsx'));
const CashiersPage = lazy(() => import('./pages/CashiersPage.tsx'));
const StoreSettingsPage = lazy(() => import('./pages/StoreSettingsPage.tsx'));
const AdminDeactivationRequestsPage = lazy(() => import('./pages/AdminDeactivationRequestsPage.tsx'));

const PageLoadingFallback: React.FC<{ message?: string }> = ({ message = 'Memuat halaman...' }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px] w-full animate-in fade-in duration-200">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 tracking-wide font-mono">
        {message}
      </span>
    </div>
  </div>
);

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
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#181A1F] flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                MEMUAT HALAMAN MASUK...
              </p>
            </div>
          </div>
        }
      >
        <LoginPage />
      </Suspense>
    );
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
          <CashiersPage
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
          <HistoryPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigateToChangePassword={() => setCurrentTab('change-password')}
            onNavigateToLoginHistory={() => setCurrentTab('login-history')}
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
      case 'change-password':
        return (
          <ChangePasswordPage
            onBackToPos={() => setCurrentTab(defaultHomeTab)}
            onNavigate={setCurrentTab}
          />
        );
      case 'reports':
        return <ReportPage onNavigate={setCurrentTab} />;
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

      {/* Main View Area with React Lazy Suspense Boundary */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Suspense fallback={<PageLoadingFallback />}>
          {renderCurrentPage()}
        </Suspense>
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

