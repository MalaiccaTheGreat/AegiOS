import { Route, useLocation, useRoute, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BusinessProvider, useBusiness } from "@/contexts/BusinessContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
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
        
        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/inventory">
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        </Route>
        
        <Route path="/employees">
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        </Route>
        
        <Route path="/time-tracking">
          <ProtectedRoute>
            <TimeTracking />
          </ProtectedRoute>
        </Route>
        
        <Route path="/quotations">
          <ProtectedRoute>
            <Quotations />
          </ProtectedRoute>
        </Route>
        
        <Route path="/invoices">
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        </Route>
        
        <Route path="/payroll">
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        </Route>
        
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        
        <Route path="/email">
          <ProtectedRoute>
            <Email />
          </ProtectedRoute>
        </Route>
        
        {/* Projects */}
        <Route path="/projects" component={ProjectsPageWithProviders} />
        <Route path="/projects/new" component={NewProjectPageWithProviders} />
        <Route path="/projects/:id" component={ProjectDetailPageWithProviders} />
        
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

    if (location === '/admin') {
      navigate('/admin/dashboard');
      return;
    }
  }, [isAuthenticated, loading, location, match, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      {/* Add more admin routes here */}
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
              <Switch>
                {/* Admin routes */}
                <Route path="/admin">
                  <AdminRoutes />
                </Route>
                
                {/* Main app routes */}
                <Route>
                  <AppContent />
                </Route>
              </Switch>
              <Toaster />
              <FloatingAssistant />
            </AdminProvider>
          </AdminAuthProvider>
        </BusinessProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
