import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  FileText,
  Activity,
  UserCog,
  Briefcase,
  Shield,
  Package
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const navItems = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    permissions: ['view_dashboard']
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    permissions: ['manage_users']
  },
  { 
    name: 'Roles & Permissions', 
    href: '/admin/roles', 
    icon: Shield,
    permissions: ['manage_roles']
  },
  { 
    name: 'Products', 
    href: '/admin/products', 
    icon: Package,
    permissions: ['manage_products']
  },
  { 
    name: 'Orders', 
    href: '/admin/orders', 
    icon: Briefcase,
    permissions: ['manage_orders']
  },
  { 
    name: 'Activity Logs', 
    href: '/admin/activity', 
    icon: Activity,
    permissions: ['view_logs']
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    permissions: ['manage_settings']
  },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { hasPermission } = useAdminAuth();

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter(item => 
    item.permissions.some(permission => hasPermission(permission))
  );

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          </div>
          
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.startsWith(item.href);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Admin User
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Super Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
