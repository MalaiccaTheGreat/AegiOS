import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Bell, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { MobileMenu } from '../layout/sidebar';

export function AdminHeader() {
  const { logout } = useAdminAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <MobileMenu />
        </div>
        
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </Button>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
