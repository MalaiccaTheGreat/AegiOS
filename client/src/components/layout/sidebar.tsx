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
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Inventory & Services", href: "/inventory", icon: Package },
  { name: "Employee Management", href: "/employees", icon: Users },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Payroll", href: "/payroll", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Email Management", href: "/email", icon: Mail },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-16 border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
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
