import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  Clock,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Mail,
  Briefcase,
  Settings,
  Shield,
  Activity,
  UserCog,
  LogOut,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/contexts/BusinessContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";


const mainNavigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/app/projects", icon: Briefcase },
    { name: "Inventory & Services", href: "/app/inventory", icon: Package },
    { name: "Employee Management", href: "/app/employees", icon: Users },
    { name: "Time Tracking", href: "/app/time-tracking", icon: Clock },
    { name: "Quotations", href: "/app/quotations", icon: FileText },
    { name: "Invoices", href: "/app/invoices", icon: Receipt },
    { name: "Payroll", href: "/app/payroll", icon: CreditCard },
    { name: "Reports", href: "/app/reports", icon: BarChart3 },
    { name: "Email Management", href: "/app/email", icon: Mail },
];

const adminNavigation = [
    { name: 'Dashboard', href: '/app/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/app/admin/users', icon: Users },
    { name: 'Roles & Permissions', href: '/app/admin/roles', icon: Shield },
    { name: 'Products', href: '/app/admin/products', icon: Package },
    { name: 'Orders', href: '/app/admin/orders', icon: Briefcase },
    { name: 'Accounting', href: '/app/admin/accounting', icon: CreditCard },
    { name: "Projects", href: "/app/admin/projects", icon: Briefcase },
    { name: "Inventory & Services", href: "/app/admin/inventory", icon: Package },
    { name: "Employee Management", href: "/app/admin/employees", icon: Users },
    { name: "Time Tracking", href: "/app/admin/time-tracking", icon: Clock },
    { name: "Quotations", href: "/app/admin/quotations", icon: FileText },
    { name: "Invoices", href: "/app/admin/invoices", icon: Receipt },
    { name: "Payroll", href: "/app/admin/payroll", icon: CreditCard },
    { name: "Reports", href: "/app/admin/reports", icon: BarChart3 },
    { name: "Email Management", href: "/app/admin/email", icon: Mail },
    { name: 'Activity Logs', href: '/app/admin/activity', icon: Activity },
    { name: 'Settings', href: '/app/admin/settings', icon: Settings },
];

function SidebarNav({ items }: { items: any }) {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-16 border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {items.map((item: any) => {
          const isActive = location === item.href || 
                         (item.href !== '/' && location.startsWith(item.href)) ||
                         (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors block",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarContent() {
    const { currentBusiness } = useBusiness();
    const [location] = useLocation();
    const isAdmin = location.startsWith('/app/admin');
    const navigation = isAdmin ? adminNavigation : mainNavigation;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center flex-shrink-0 px-4 h-16 border-b">
                <Building className="h-8 w-8 text-indigo-600" />
                <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                    {isAdmin ? 'Admin Panel' : 'AegisOS'}
                </h2>
            </div>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                {currentBusiness && !isAdmin && (
                    <div className="px-4 mb-4">
                        <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={currentBusiness.logoUrl || ''} alt={currentBusiness.name} />
                                <AvatarFallback>{currentBusiness.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {currentBusiness.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Business
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <SidebarNav items={navigation} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {isAdmin ? 'Admin User' : 'User Name'}
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isAdmin ? 'Super Admin' : 'User Role'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start mt-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function Sidebar() {
    const { isOpen, setIsOpen } = useSidebar();

    return (
        <>
            {/* Mobile Sidebar */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="left" className="p-0 w-64">
                   <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <SidebarContent />
                </div>
            </div>
        </>
    );
}

export function MobileMenu() {
    const { setIsOpen } = useSidebar();
    return (
        <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(true)}
        >
            <Menu className="h-6 w-6" />
        </Button>
    );
}
