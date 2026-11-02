import React, { lazy, Suspense } from 'react';
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
import { ThemeProvider } from './context/ThemeContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { IdleTimerModal } from './components/IdleTimerModal.tsx';
import { useIdleTimer } from './hooks/useIdleTimer.ts';
import { ActiveTab } from './components/TopNavbar.tsx';
import { ADMIN, SHOP_OWNER, SHOP_CASHIER, ROLES, type UserRole } from './constants/roles.ts';

// Core layout error boundaries (loaded synchronously to avoid fallback failure)
import ErrorPage from './pages/ErrorPage.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import { AdminDrillProvider } from './context/AdminDrillContext.tsx';

/**
 * Helper to dynamically load a page component using React Router's native route `lazy` property.
 */
function routeLazy<T = any>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  return async () => {
    const mod = await importFn();
    return { Component: mod.default };
  };
}

/**
 * Fallback loading spinners for lazy-loaded page transitions
 */
const FullPageLoadingFallback: React.FC = () => (
  <div className="min-h-screen w-screen bg-[#181A1F] flex items-center justify-center p-6">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-mono tracking-wider">
        MEMUAT KASIR WARUNG...
      </span>
    </div>
  </div>
);

const PageLoadingFallback: React.FC = () => (
  <div className="flex-1 w-full h-full min-h-[300px] flex items-center justify-center p-6 bg-transparent">
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[var(--text-muted)] font-medium tracking-wide">
        Memuat halaman...
      </span>
    </div>
  </div>
);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans">
      {/* Dark Sidebar with direct page navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onLogout={logout}
      />

      {/* Main View Area with ErrorBoundary and Suspense protection for lazy-loaded pages */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
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

// ==========================================
// Layout Guards
// ==========================================

/**
 * GuestGuardLayout:
 * Layout Guard for unauthenticated/guest routes (e.g. /login).
 * If the user is already authenticated, redirects immediately to their designated home route:
 * - ADMIN -> /tenants
 * - SHOP_OWNER / SHOP_CASHIER -> /
 */
const GuestGuardLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoadingFallback />;
  }

  if (user) {
    return <Navigate to={user.role === ADMIN ? '/tenants' : '/'} replace />;
  }

  return (
    <Suspense fallback={<FullPageLoadingFallback />}>
      <Outlet />
    </Suspense>
  );
};

/**
 * RoleGuard Component:
 * Controls access to routes based on allowed user roles.
 * If user does not possess an allowed role, safely redirects:
 * - ADMIN -> /tenants
 * - Non-ADMIN -> /
 */
export interface RoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user?.role === ADMIN ? '/tenants' : '/'} replace />;
  }

  return <Outlet />;
};

// ==========================================
// Router Configuration with Route lazy Property & Layout Guards
// ==========================================

const router = createBrowserRouter([
  // Guest-only routes (protected by GuestGuardLayout)
  {
    element: <GuestGuardLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const { default: LoginPage } = await import('./pages/LoginPage.tsx');
          const Component: React.FC = () => {
            const navigate = useNavigate();
            return <LoginPage onOpenPrivacyPolicy={() => navigate('/privacy-policy')} />;
          };
          return { Component };
        },
      },
    ],
  },

  // Publicly accessible route (viewable by guest or authenticated users)
  {
    path: '/privacy-policy',
    errorElement: <RouteErrorBoundary />,
    lazy: async () => {
      const { default: PrivacyPolicyPage } = await import('./pages/PrivacyPolicyPage.tsx');
      const Component: React.FC = () => {
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
      return { Component };
    },
  },

  // Authenticated application routes with AppLayout (Auth Guard + App Shell)
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // POS Cashier Routes (protected by RoleGuard: SHOP_OWNER, SHOP_CASHIER)
      {
        element: <RoleGuard allowedRoles={[SHOP_OWNER, SHOP_CASHIER]} />,
        children: [
          {
            index: true,
            lazy: routeLazy(() => import('./pages/OrderPage.tsx')),
          },
          {
            path: 'pos',
            lazy: routeLazy(() => import('./pages/OrderPage.tsx')),
          },
        ],
      },

      // Catalog & Categories (polymorphic based on role)
      {
        path: 'products',
        lazy: async () => {
          const [{ default: ProductsPage }, { default: AdminProductsPage }] = await Promise.all([
            import('./pages/ProductsPage.tsx'),
            import('./pages/AdminProductsPage.tsx'),
          ]);
          const Component: React.FC = () => {
            const { user } = useAuth();
            return user?.role === ADMIN ? <AdminProductsPage /> : <ProductsPage />;
          };
          return { Component };
        },
      },
      {
        path: 'categories',
        lazy: async () => {
          const [{ default: CategoriesPage }, { default: AdminCategoriesPage }] = await Promise.all([
            import('./pages/CategoriesPage.tsx'),
            import('./pages/AdminCategoriesPage.tsx'),
          ]);
          const Component: React.FC = () => {
            const { user } = useAuth();
            const navigate = useNavigate();
            return user?.role === ADMIN ? (
              <AdminCategoriesPage />
            ) : (
              <CategoriesPage onFilterCategory={() => navigate('/products')} />
            );
          };
          return { Component };
        },
      },

      // Shared Authenticated Routes
      {
        path: 'history',
        lazy: routeLazy(() => import('./pages/OrderHistoryPage.tsx')),
      },
      {
        path: 'profile',
        lazy: routeLazy(() => import('./pages/ProfilePage.tsx')),
      },
      {
        path: 'login-history',
        lazy: routeLazy(() => import('./pages/LoginHistoryPage.tsx')),
      },
      {
        path: 'active-tokens',
        lazy: routeLazy(() => import('./pages/ActiveTokensPage.tsx')),
      },
      {
        path: 'activity-log',
        lazy: routeLazy(() => import('./pages/ActivityLogPage.tsx')),
      },
      {
        path: 'system-logs',
        lazy: routeLazy(() => import('./pages/LogViewerPage.tsx')),
      },
      {
        path: 'change-password',
        lazy: routeLazy(() => import('./pages/ChangePasswordPage.tsx')),
      },

      // Store Settings (protected by RoleGuard: SHOP_OWNER, ADMIN)
      {
        element: <RoleGuard allowedRoles={[SHOP_OWNER, ADMIN]} />,
        children: [
          {
            path: 'store-settings',
            lazy: routeLazy(() => import('./pages/StoreSettingsPage.tsx')),
          },
        ],
      },

      // Cashier Users Management (protected by RoleGuard: SHOP_OWNER, ADMIN)
      {
        element: <RoleGuard allowedRoles={[SHOP_OWNER, ADMIN]} />,
        children: [
          {
            path: 'cashiers',
            lazy: routeLazy(() => import('./pages/UsersPage.tsx')),
          },
        ],
      },

      // Platform Administrator Routes (protected by RoleGuard: ADMIN)
      {
        element: <RoleGuard allowedRoles={[ADMIN]} />,
        children: [
          {
            path: 'tenants',
            lazy: routeLazy(() => import('./pages/TenantsPage.tsx')),
          },
          {
            path: 'admin-products',
            lazy: routeLazy(() => import('./pages/AdminProductsPage.tsx')),
          },
          {
            path: 'admin-categories',
            lazy: routeLazy(() => import('./pages/AdminCategoriesPage.tsx')),
          },
          {
            path: 'deactivation-requests',
            lazy: routeLazy(() => import('./pages/AdminDeactivationRequestsPage.tsx')),
          },
        ],
      },

      // Fallback inside layout
      {
        path: '*',
        lazy: async () => {
          const { default: NotFoundPage } = await import('./pages/NotFoundPage.tsx');
          const Component: React.FC = () => {
            const location = useLocation();
            return <NotFoundPage attemptedPath={location.pathname} />;
          };
          return { Component };
        },
      },
    ],
  },

  // Fallback outside layout
  {
    path: '*',
    lazy: async () => {
      const { default: NotFoundPage } = await import('./pages/NotFoundPage.tsx');
      const Component: React.FC = () => {
        const location = useLocation();
        return <NotFoundPage attemptedPath={location.pathname} />;
      };
      return { Component };
    },
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
  return (
    <ErrorBoundary isFullPage>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <AdminDrillProvider>
                <RouterProvider router={router} />
              </AdminDrillProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
