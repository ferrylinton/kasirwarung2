import React, { useState, createContext, useContext } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation,
  Navigate,
  useRouteError,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { IdleTimerModal } from './components/IdleTimerModal.tsx';
import { useIdleTimer } from './hooks/useIdleTimer.ts';
import { ActiveTab } from './components/TopNavbar.tsx';
import { ADMIN, SHOP_OWNER, SHOP_CASHIER, ROLES, type UserRole } from './constants/roles.ts';

// Direct component imports
import OrderPage from './pages/OrderPage.tsx';
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
import ActivityLogPage from './pages/ActivityLogPage.tsx';
import LogViewerPage from './pages/LogViewerPage.tsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import ErrorPage from './pages/ErrorPage.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

// Admin Drill-down Context for filtering tenant products from categories
interface AdminDrillContextType {
  adminDrillTenantId: string;
  setAdminDrillTenantId: (id: string) => void;
  adminDrillCategory: string;
  setAdminDrillCategory: (cat: string) => void;
}

const AdminDrillContext = createContext<AdminDrillContextType>({
  adminDrillTenantId: 'ALL',
  setAdminDrillTenantId: () => {},
  adminDrillCategory: 'Semua Produk',
  setAdminDrillCategory: () => {},
});

export const useAdminDrill = () => useContext(AdminDrillContext);

/**
 * Maps an ActiveTab to a URL pathname
 */
export const tabToPath = (tab: ActiveTab): string => {
  if (tab === 'pos') return '/';
  return `/${tab}`;
};

/**
 * Maps a URL pathname to an ActiveTab
 */
export const pathToTab = (pathname: string, userRole?: string): ActiveTab => {
  const clean = pathname.replace(/^\/+/, '').split('?')[0].split('#')[0];
  if (!clean || clean === 'pos') {
    return userRole === ADMIN ? 'tenants' : 'pos';
  }
  return (clean as ActiveTab) || 'pos';
};

/**
 * Layout component for authenticated routes (Sidebar, Outlet, IdleTimer)
 */
const AppLayout: React.FC = () => {
  const { user, loading, logout, idleTimeoutMinutes } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Inactivity auto-logout hook based on IDLE_TIMEOUT_MINUTES from .env
  const { showWarning, secondsRemaining, resetTimer } = useIdleTimer({
    timeoutMinutes: idleTimeoutMinutes || 5,
    onTimeout: () => {
      logout();
    },
    warningSeconds: 30,
    enabled: !!user,
  });

  // Backward compatibility: If accessed via hash (e.g. /#products), redirect to router path
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname);
        navigate(hash === 'pos' ? '/' : `/${hash}`, { replace: true });
      }
    }
  }, [navigate]);

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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentTab = pathToTab(location.pathname, user.role);

  const handleSelectTab = (tab: ActiveTab) => {
    navigate(tabToPath(tab));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6F8] font-sans">
      {/* Dark Sidebar with direct page navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={logout}
      />

      {/* Main View Area with ErrorBoundary protection */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

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

// Route Error Boundary for React Router
const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { user } = useAuth();

  console.error('[KasirWarung Router Error]:', error);

  return (
    <ErrorPage
      onReset={() => navigate(user?.role === ADMIN ? '/tenants' : '/')}
    />
  );
};

// Wrapper Components
const LoginPageWrapper: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A1F] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === ADMIN ? '/tenants' : '/'} replace />;
  }

  return <LoginPage onOpenPrivacyPolicy={() => navigate('/privacy-policy')} />;
};

const PrivacyPolicyRouteWrapper: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PrivacyPolicyPage
      onBack={() => {
        if (user) {
          navigate(user.role === ADMIN ? '/tenants' : '/');
        } else {
          navigate('/login');
        }
      }}
    />
  );
};

const IndexRouteWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === ADMIN) {
    return <Navigate to="/tenants" replace />;
  }

  return <OrderPage />;
};

const OrderPageWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === ADMIN) {
    return <Navigate to="/tenants" replace />;
  }

  return <OrderPage />;
};

const ProductsPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const { adminDrillTenantId, adminDrillCategory } = useAdminDrill();

  if (user?.role === ADMIN) {
    return (
      <AdminProductsPage
        initialTenantId={adminDrillTenantId}
        initialCategory={adminDrillCategory}
      />
    );
  }

  return <ProductsPage />;
};

const CategoriesPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setAdminDrillTenantId, setAdminDrillCategory } = useAdminDrill();

  if (user?.role === ADMIN) {
    return (
      <AdminCategoriesPage
        onFilterTenantProducts={(tId, catName) => {
          setAdminDrillTenantId(tId);
          setAdminDrillCategory(catName);
          navigate('/admin-products');
        }}
      />
    );
  }

  return (
    <CategoriesPage
      onFilterCategory={() => navigate('/products')}
    />
  );
};

const TenantsPageWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <TenantsPage />;
};

const AdminProductsPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const { adminDrillTenantId, adminDrillCategory } = useAdminDrill();

  if (user?.role !== ADMIN) {
    return <Navigate to="/products" replace />;
  }

  return (
    <AdminProductsPage
      initialTenantId={adminDrillTenantId}
      initialCategory={adminDrillCategory}
    />
  );
};

const AdminCategoriesPageWrapper: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setAdminDrillTenantId, setAdminDrillCategory } = useAdminDrill();

  if (user?.role !== ADMIN) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <AdminCategoriesPage
      onFilterTenantProducts={(tId, catName) => {
        setAdminDrillTenantId(tId);
        setAdminDrillCategory(catName);
        navigate('/admin-products');
      }}
    />
  );
};

const AdminDeactivationRequestsPageWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== ADMIN) {
    return <Navigate to="/" replace />;
  }

  return <AdminDeactivationRequestsPage />;
};

const UsersPageWrapper: React.FC = () => {
  return <UsersPage />;
};

const StoreSettingsPageWrapper: React.FC = () => {
  return <StoreSettingsPage />;
};

const OrderHistoryPageWrapper: React.FC = () => {
  return <OrderHistoryPage />;
};

const ProfilePageWrapper: React.FC = () => {
  return <ProfilePage />;
};

const LoginHistoryPageWrapper: React.FC = () => {
  return <LoginHistoryPage />;
};

const ActiveTokensPageWrapper: React.FC = () => {
  return <ActiveTokensPage />;
};

const ActivityLogPageWrapper: React.FC = () => {
  return <ActivityLogPage />;
};

const LogViewerPageWrapper: React.FC = () => {
  return <LogViewerPage />;
};

const ChangePasswordPageWrapper: React.FC = () => {
  return <ChangePasswordPage />;
};

const NotFoundPageWrapper: React.FC = () => {
  const location = useLocation();
  return (
    <NotFoundPage
      attemptedPath={location.pathname}
    />
  );
};

// Define application routes with createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPageWrapper />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyRouteWrapper />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <IndexRouteWrapper />,
      },
      {
        path: 'pos',
        element: <OrderPageWrapper />,
      },
      {
        path: 'products',
        element: <ProductsPageWrapper />,
      },
      {
        path: 'categories',
        element: <CategoriesPageWrapper />,
      },
      {
        path: 'history',
        element: <OrderHistoryPageWrapper />,
      },
      {
        path: 'profile',
        element: <ProfilePageWrapper />,
      },
      {
        path: 'login-history',
        element: <LoginHistoryPageWrapper />,
      },
      {
        path: 'active-tokens',
        element: <ActiveTokensPageWrapper />,
      },
      {
        path: 'activity-log',
        element: <ActivityLogPageWrapper />,
      },
      {
        path: 'system-logs',
        element: <LogViewerPageWrapper />,
      },
      {
        path: 'change-password',
        element: <ChangePasswordPageWrapper />,
      },
      {
        path: 'tenants',
        element: <TenantsPageWrapper />,
      },
      {
        path: 'admin-products',
        element: <AdminProductsPageWrapper />,
      },
      {
        path: 'admin-categories',
        element: <AdminCategoriesPageWrapper />,
      },
      {
        path: 'cashiers',
        element: <UsersPageWrapper />,
      },
      {
        path: 'store-settings',
        element: <StoreSettingsPageWrapper />,
      },
      {
        path: 'deactivation-requests',
        element: <AdminDeactivationRequestsPageWrapper />,
      },
      {
        path: '*',
        element: <NotFoundPageWrapper />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPageWrapper />,
  },
]);

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
  const [adminDrillTenantId, setAdminDrillTenantId] = useState<string>('ALL');
  const [adminDrillCategory, setAdminDrillCategory] = useState<string>('Semua Produk');

  return (
    <ErrorBoundary isFullPage>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <AdminDrillContext.Provider
              value={{
                adminDrillTenantId,
                setAdminDrillTenantId,
                adminDrillCategory,
                setAdminDrillCategory,
              }}
            >
              <RouterProvider router={router} />
            </AdminDrillContext.Provider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
