import { Route, useLocation, useRoute, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessProvider, useBusiness } from "@/contexts/BusinessContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogin } from "@/pages/admin/login";
import { AdminDashboard } from "@/pages/admin/dashboard";
import AdminAccounting from "@/pages/admin/accounting";
import AdminProjects from "@/pages/admin/projects";
import AdminInventory from "@/pages/admin/inventory";
import AdminEmployees from "@/pages/admin/employees";
import AdminTimeTracking from "@/pages/admin/time-tracking";
import AdminQuotations from "@/pages/admin/quotations";
import AdminInvoices from "@/pages/admin/invoices";
import AdminPayroll from "@/pages/admin/payroll";
import AdminReports from "@/pages/admin/reports";
import AdminEmail from "@/pages/admin/email";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/layout";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Employees from "@/pages/employees";
import TimeTracking from "@/pages/time-tracking";
import Quotations from "@/pages/quotations";
import Invoices from "@/pages/invoices";
import Payroll from "@/pages/payroll";
import Reports from "@/pages/reports";
import Email from "@/pages/email";
import NotFound from "@/pages/not-found";
import { BusinessSetup } from "@/components/business/BusinessSetup";
import { ProjectsPageWithProviders } from "@/pages/projects";
import { ProjectDetailPageWithProviders } from "@/pages/projects/[id]";
import { NewProjectPageWithProviders } from "@/pages/projects/new";
import { DocumentHead } from "@/components/seo/DocumentHead";
import FloatingAssistant from "@/components/ai/FloatingAssistant";
import { SidebarProvider } from "./contexts/SidebarContext";

// Create a single instance of QueryClient
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const businessContext = useBusiness();
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (businessContext) {
      if (!businessContext.currentBusiness) {
        navigate('/business/setup');
      }
      setIsLoading(false);
    }
  }, [businessContext, navigate]);

  if (isLoading || !businessContext) {
    return <div>Loading...</div>;
  }

  if (!businessContext.currentBusiness) {
    return null;
  }

  return <>{children}</>;
};

function AppContent() {
  const [location] = useLocation();
  
  // Set document title based on current route
  useEffect(() => {
    const routeTitles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/inventory': 'Inventory',
      '/employees': 'Employees',
      '/time-tracking': 'Time Tracking',
      '/quotations': 'Quotations',
      '/invoices': 'Invoices',
      '/payroll': 'Payroll',
      '/reports': 'Reports',
      '/email': 'Email'
    };
    
    const baseTitle = 'AegiOS';
    const routeTitle = routeTitles[location] || '';
    document.title = routeTitle ? `${routeTitle} | ${baseTitle}` : baseTitle;
  }, [location]);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Main App Routes - Protected */}
        <Route path="/app">
          <ProtectedRoute>
            <Layout>
              <Switch>
                <Route path="/app/dashboard" component={Dashboard} />
                <Route path="/app/inventory" component={Inventory} />
                <Route path="/app/employees" component={Employees} />
                <Route path="/app/time-tracking" component={TimeTracking} />
                <Route path="/app/quotations" component={Quotations} />
                <Route path="/app/invoices" component={Invoices} />
                <Route path="/app/payroll" component={Payroll} />
                <Route path="/app/reports" component={Reports} />
                <Route path="/app/email" component={Email} />
                <Route path="/app/business/setup" component={BusinessSetup} />
                <Route path="/app/projects" component={ProjectsPageWithProviders} />
                <Route path="/app/projects/new" component={NewProjectPageWithProviders} />
                <Route path="/app/projects/:id" component={ProjectDetailPageWithProviders} />
                <Route path="/app/admin/:rest*" component={AdminRoutes} />
                <Route><Redirect to="/app/dashboard" /></Route>
              </Switch>
            </Layout>
          </ProtectedRoute>
        </Route>
        
        {/* 404 - Not Found */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// Admin routes wrapper component
function AdminRoutes() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [location, navigate] = useLocation();
  const [match] = useRoute('/admin/:rest*');

  useEffect(() => {
    if (loading) return;
    
    if (match && !isAuthenticated && !location.startsWith('/admin/login')) {
      navigate('/admin/login');
      return;
    }

    // Redirect /admin to /admin/dashboard
    if (location === '/admin' || location === '/admin/') {
      navigate('/admin/dashboard');
      return;
    }
  }, [isAuthenticated, loading, location, match, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If on login page and already authenticated, redirect to dashboard
  if (isAuthenticated && location.startsWith('/admin/login')) {
    return <Redirect to="/admin/dashboard" />;
  }

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/accounting">
        <AdminLayout>
          <AdminAccounting />
        </AdminLayout>
      </Route>
      <Route path="/admin/projects">
        <AdminLayout>
          <AdminProjects />
        </AdminLayout>
      </Route>
      <Route path="/admin/inventory">
        <AdminLayout>
          <AdminInventory />
        </AdminLayout>
      </Route>
      <Route path="/admin/employees">
        <AdminLayout>
          <AdminEmployees />
        </AdminLayout>
      </Route>
      <Route path="/admin/time-tracking">
        <AdminLayout>
          <AdminTimeTracking />
        </AdminLayout>
      </Route>
      <Route path="/admin/quotations">
        <AdminLayout>
          <AdminQuotations />
        </AdminLayout>
      </Route>
      <Route path="/admin/invoices">
        <AdminLayout>
          <AdminInvoices />
        </AdminLayout>
      </Route>
      <Route path="/admin/payroll">
        <AdminLayout>
          <AdminPayroll />
        </AdminLayout>
      </Route>
      <Route path="/admin/reports">
        <AdminLayout>
          <AdminReports />
        </AdminLayout>
      </Route>
      <Route path="/admin/email">
        <AdminLayout>
          <AdminEmail />
        </AdminLayout>
      </Route>
      <Route path="/admin/*">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BusinessProvider>
          <AdminAuthProvider>
            <AdminProvider>
              <SidebarProvider>
                <AppContent />
                <Toaster />
                <FloatingAssistant />
              </SidebarProvider>
            </AdminProvider>
          </AdminAuthProvider>
        </BusinessProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
