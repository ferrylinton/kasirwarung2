import React, { createContext, useContext, useState } from 'react';

export interface AdminDrillContextType {
  adminDrillTenantId: string;
  setAdminDrillTenantId: (id: string) => void;
  adminDrillCategory: string;
  setAdminDrillCategory: (cat: string) => void;
}

export const AdminDrillContext = createContext<AdminDrillContextType>({
  adminDrillTenantId: 'ALL',
  setAdminDrillTenantId: () => {},
  adminDrillCategory: 'Semua Produk',
  setAdminDrillCategory: () => {},
});

export const useAdminDrill = () => useContext(AdminDrillContext);

export const AdminDrillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminDrillTenantId, setAdminDrillTenantId] = useState<string>('ALL');
  const [adminDrillCategory, setAdminDrillCategory] = useState<string>('Semua Produk');

  return (
    <AdminDrillContext.Provider
      value={{
        adminDrillTenantId,
        setAdminDrillTenantId,
        adminDrillCategory,
        setAdminDrillCategory,
      }}
    >
      {children}
    </AdminDrillContext.Provider>
  );
};
