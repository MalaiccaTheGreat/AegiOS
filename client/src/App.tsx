import { Switch, Route, useLocation, Redirect } from "wouter";
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
import { useEffect } from "react";
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

function AppContent() {
  const [location] = useLocation();
  const businessContext = useBusiness();
  
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
      '/email': 'Email',
      '/projects': 'Projects',
    };
    
    const baseTitle = 'AegisOS';
    const pageTitle = routeTitles[location] || '';
    document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
  }, [location]);

  // Show loading state
  if (businessContext?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const businesses = businessContext?.businesses || [];
  const currentBusiness = businessContext?.currentBusiness;

  // Handle business setup flow for logged-in users
  if (currentBusiness || location === '/dashboard' || location.startsWith('/business')) {
    // Redirect to business setup if no businesses exist
    if (businesses.length === 0 && !location.startsWith("/business")) {
      return <BusinessSetup />;
    }

    // If no business is selected but businesses exist, redirect to dashboard
    if (!currentBusiness && businesses.length > 0 && !location.startsWith("/business")) {
      return <div>Loading your business...</div>;
    }
  }

  return (
    <>
      <DocumentHead />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Protected routes - only accessible when logged in */}
        <Route path="/app">
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
              <Route path="/app/business/new" component={BusinessSetup} />
              <Route path="/app/projects" component={ProjectsPageWithProviders} />
              <Route path="/app/projects/new" component={NewProjectPageWithProviders} />
              <Route path="/app/projects/:id" component={ProjectDetailPageWithProviders} />
              <Route path="/app/admin/:rest*" component={AdminRoutes} />
              <Route><Redirect to="/app/dashboard" /></Route>
            </Switch>
          </Layout>
        </Route>
        
        {/* Redirect old routes to new /app/ prefixed routes */}
        <Route path="/dashboard"><Redirect to="/app/dashboard" /></Route>
        <Route path="/inventory"><Redirect to="/app/inventory" /></Route>
        <Route path="/employees"><Redirect to="/app/employees" /></Route>
        <Route path="/time-tracking"><Redirect to="/app/time-tracking" /></Route>
        <Route path="/quotations"><Redirect to="/app/quotations" /></Route>
        <Route path="/invoices"><Redirect to="/app/invoices" /></Route>
        <Route path="/payroll"><Redirect to="/app/payroll" /></Route>
        <Route path="/reports"><Redirect to="/app/reports" /></Route>
        <Route path="/email"><Redirect to="/app/email" /></Route>
        <Route path="/business/new"><Redirect to="/app/business/new" /></Route>
        <Route path="/projects"><Redirect to="/app/projects" /></Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// Admin routes wrapper component
function AdminRoutes() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated && !location.startsWith('/app/admin/login')) {
    return <Redirect to="/app/admin/login" />;
  }

  // If on login page and already authenticated, redirect to dashboard
  if (isAuthenticated && location === '/app/admin/login') {
    return <Redirect to="/app/admin/dashboard" />;
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/app/admin/dashboard" component={AdminDashboard} />
        <Route path="/app/admin/login" component={AdminLogin} />
        <Route path="/app/admin/accounting" component={AdminAccounting} />
        <Route path="/app/admin/projects" component={AdminProjects} />
        <Route path="/app/admin/inventory" component={AdminInventory} />
        <Route path="/app/admin/employees" component={AdminEmployees} />
        <Route path="/app/admin/time-tracking" component={AdminTimeTracking} />
        <Route path="/app/admin/quotations" component={AdminQuotations} />
        <Route path="/app/admin/invoices" component={AdminInvoices} />
        <Route path="/app/admin/payroll" component={AdminPayroll} />
        <Route path="/app/admin/reports" component={AdminReports} />
        <Route path="/app/admin/email" component={AdminEmail} />
        <Route>
          <Redirect to="/app/admin/dashboard" />
        </Route>
      </Switch>
    </AdminLayout>
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
