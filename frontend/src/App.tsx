import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { PosPage } from './pages/PosPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { ReportPage } from './pages/ReportPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { LoginHistoryPage } from './pages/LoginHistoryPage.tsx';
import { ChangePasswordPage } from './pages/ChangePasswordPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { ShiftModal } from './components/ShiftModal.tsx';
import { IdleTimerModal } from './components/IdleTimerModal.tsx';
import { useIdleTimer } from './hooks/useIdleTimer.ts';
import { ActiveTab } from './components/TopNavbar.tsx';

const AppContent: React.FC = () => {
  const { user, loading, logout, idleTimeoutMinutes } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('pos');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Inactivity auto-logout hook based on IDLE_TIMEOUT_MINUTES from .env
  const { showWarning, secondsRemaining, resetTimer } = useIdleTimer({
    timeoutMinutes: idleTimeoutMinutes || 5,
    onTimeout: () => {
      logout();
    },
    warningSeconds: 30,
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

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'products':
        return (
          <ProductsPage
            onBackToPos={() => setCurrentTab('pos')}
            onNavigate={setCurrentTab}
          />
        );
      case 'history':
        return (
          <HistoryPage
            onBackToPos={() => setCurrentTab('pos')}
            onNavigate={setCurrentTab}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            onBackToPos={() => setCurrentTab('pos')}
            onNavigateToChangePassword={() => setCurrentTab('change-password')}
            onNavigateToLoginHistory={() => setCurrentTab('login-history')}
            onOpenSwitchShift={() => setIsShiftModalOpen(true)}
            onNavigate={setCurrentTab}
          />
        );
      case 'login-history':
        return (
          <LoginHistoryPage
            onBackToPos={() => setCurrentTab('pos')}
            onNavigate={setCurrentTab}
          />
        );
      case 'change-password':
        return (
          <ChangePasswordPage
            onBackToPos={() => setCurrentTab('pos')}
            onNavigate={setCurrentTab}
          />
        );
      case 'reports':
        return <ReportPage onNavigate={setCurrentTab} />;
      case 'pos':
      default:
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

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
