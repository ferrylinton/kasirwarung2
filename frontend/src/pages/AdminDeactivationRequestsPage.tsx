import React from 'react';
import { TenantsPage } from './TenantsPage.tsx';
import { ActiveTab } from '../components/TopNavbar.tsx';

export { DeactivationRequests } from '../components/DeactivationRequests.tsx';

interface AdminDeactivationRequestsPageProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const AdminDeactivationRequestsPage: React.FC<AdminDeactivationRequestsPageProps> = ({
  onNavigate,
}) => {
  return <TenantsPage initialTab="deactivation-requests" onNavigate={onNavigate} />;
};
