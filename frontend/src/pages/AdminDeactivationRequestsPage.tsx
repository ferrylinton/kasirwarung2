import React from 'react';
import { TenantsPage } from './TenantsPage.tsx';

export { DeactivationRequests } from '../components/DeactivationRequests.tsx';

export const AdminDeactivationRequestsPage: React.FC = () => {
  return <TenantsPage initialTab="deactivation-requests" />;
};

export default AdminDeactivationRequestsPage;
