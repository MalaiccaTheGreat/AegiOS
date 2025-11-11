// Basic types for the dashboard

declare module '@shared/schema' {
  export interface Service {
    id: number;
    name: string;
    description?: string;
    price: number;
    duration: number;
    business_id: number;
  }

  export interface Employee {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    business_id: number;
  }

  export interface DashboardStats {
    activeProjects: number;
    pendingQuotations: number;
    monthlyRevenue: number;
    teamHours: number;
  }
}
