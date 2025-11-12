import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super-admin';
  permissions: string[];
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Check for existing admin session
    const checkAuth = async () => {
      try {
        // TODO: Implement token verification with your backend
        const token = localStorage.getItem('admin_token');
        if (token) {
          // Verify token with backend
          // const response = await fetch('/api/admin/me', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // const adminData = await response.json();
          // setAdmin(adminData);
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
        localStorage.removeItem('admin_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual admin login API
      // const response = await fetch('/api/admin/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      
      // Mock response for now
      const data = {
        user: {
          id: 'admin-1',
          email: email,
          name: 'Admin User',
          role: 'super-admin',
          permissions: ['*']
        },
        token: 'mock-admin-token'
      };

      localStorage.setItem('admin_token', data.token);
      setAdmin(data.user);
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login failed:', error);
      toast.error('Invalid admin credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    toast.success('Logged out from admin panel');
    navigate('/admin/login');
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'super-admin') return true;
    return admin.permissions.includes(permission) || admin.permissions.includes('*');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
