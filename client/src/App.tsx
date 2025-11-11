import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessProvider, useBusiness } from "@/contexts/BusinessContext";
import { AdminProvider } from "@/contexts/AdminContext";
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DocumentHead />
        <FloatingAssistant />
        <AdminProvider>
          <BusinessProvider>
            <AppContent />
          </BusinessProvider>
        </AdminProvider>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
