import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { Tenant } from '../services/api.ts';
import { TopNavbar } from '../components/TopNavbar.tsx';
import { DeactivationRequests } from '../components/DeactivationRequests.tsx';
import { TenantsList } from '../components/TenantsList.tsx';
import { useTenants } from '../hooks/useQueries.ts';

interface TenantsPageProps {
  onBackToPos?: () => void;
  onNavigate?: (tab: any) => void;
  initialTab?: 'tenants' | 'deactivation-requests';
}

export const TenantsPage: React.FC<TenantsPageProps> = ({ onNavigate, initialTab = 'tenants' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tenants' | 'deactivation-requests'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // TanStack Query for tenants
  const { data: tenantsData, isLoading: loading, refetch: fetchTenants } = useTenants();
  const tenants = tenantsData?.data || [];

  const pendingRequests = tenants.filter(
    (t) => t.deactivationRequest && t.deactivationRequest.status === 'pending'
  );



  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F6F8]">
      <TopNavbar currentTab="tenants" onNavigate={onNavigate} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 space-y-6">
        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 flex-wrap">
          <button
            onClick={() => setActiveSubTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'tenants'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Daftar Seluruh Tenan ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('deactivation-requests')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'deactivation-requests'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Permintaan Penonaktifan</span>
            {pendingRequests.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeSubTab === 'deactivation-requests'
                    ? 'bg-white text-purple-700'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}
              >
                {pendingRequests.length} Menunggu
              </span>
            )}
          </button>
        </div>

        {/* View Mode: DeactivationRequests vs Tenants List */}
        {activeSubTab === 'deactivation-requests' ? (
          <DeactivationRequests
            onNavigate={onNavigate}
            onRequestReviewed={() => { fetchTenants(); }}
          />
        ) : (
          <TenantsList
            tenants={tenants}
            loading={loading}
            onRefresh={() => { fetchTenants(); }}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
};

export default TenantsPage;
