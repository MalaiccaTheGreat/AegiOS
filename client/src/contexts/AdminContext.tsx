import { createContext, useContext, useState, ReactNode } from 'react';

type AdminContextType = {
  isAdmin: boolean;
  toggleAdmin: () => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
    if (!isAdmin) {
      localStorage.setItem('adminMode', 'true');
    } else {
      localStorage.removeItem('adminMode');
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, toggleAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
