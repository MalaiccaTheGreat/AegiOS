import { ReactNode } from 'react';
import { Navigate, useLocation } from 'wouter';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

export function ProtectedRoute({ children, requiredPermissions = [] }: ProtectedRouteProps) {
  const { admin, isAuthenticated, isLoading, hasPermission } = useAdminAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check if user has all required permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    hasPermission(permission)
  );

  if (!hasRequiredPermissions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
