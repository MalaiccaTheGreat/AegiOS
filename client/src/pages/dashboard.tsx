import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  FileText, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Activity,
  BarChart3,
  AlertTriangle,
  Bolt,
  Mail,
  StepForward,
  Lightbulb,
  DoorClosed
} from "lucide-react";
import { BusinessHealthCard } from "@/components/ai/BusinessHealthCard";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import TimeModal from "@/components/modals/time-modal";
import QuotationModal from "@/components/modals/quotation-modal";
import EmailModal from "@/components/modals/email-modal";
import EmployeeModal from "@/components/modals/employee-modal";
import ServiceModal from "@/components/modals/service-modal";
import type { Service, Employee } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const { data: metrics = {
    activeProjects: 0,
    pendingQuotations: 0,
    monthlyRevenue: 0,
    teamHours: 0
  }, isLoading: metricsLoading } = useQuery<{
    activeProjects: number;
    pendingQuotations: number;
    monthlyRevenue: number;
    teamHours: number;
  }>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "structural":
        return <StepForward className="text-primary" size={16} />;
      case "electrical":
        return <Lightbulb className="text-warning" size={16} />;
      case "hardware":
        return <DoorClosed className="text-secondary" size={16} />;
      default:
        return <Bolt size={16} />;
    }
  };

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your business performance and insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hidden md:flex">
              <Activity className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <Tabs 
          defaultValue="overview" 
          className="space-y-4"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4" />
              <span>AI Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Projects</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics?.activeProjects || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Home className="text-primary" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="text-success mr-1" size={16} />
                    <span className="text-success text-sm font-medium">+8%</span>
                    <span className="text-gray-600 text-sm ml-2">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Quotations</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics?.pendingQuotations || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <FileText className="text-warning" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingDown className="text-error mr-1" size={16} />
                    <span className="text-error text-sm font-medium">-3</span>
                    <span className="text-gray-600 text-sm ml-2">from yesterday</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">${metrics?.monthlyRevenue?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-success" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="text-success mr-1" size={16} />
                    <span className="text-success text-sm font-medium">+15%</span>
                    <span className="text-gray-600 text-sm ml-2">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Hours (This Week)</p>
                      <p className="text-3xl font-bold text-gray-900">{metrics?.teamHours || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Clock className="text-secondary" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="text-success mr-1" size={16} />
                    <span className="text-success text-sm font-medium">+12 hrs</span>
                    <span className="text-gray-600 text-sm ml-2">overtime</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <BusinessHealthCard />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Business Insights</CardTitle>
                <CardDescription>
                  Intelligent analysis of your business performance and opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InsightsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="text-center">Loading dashboard metrics...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Container Home Construction Management System</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.activeProjects || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Home className="text-primary" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="text-success mr-1" size={16} />
                <span className="text-success text-sm font-medium">+8%</span>
                <span className="text-gray-600 text-sm ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Quotations</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.pendingQuotations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-warning" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingDown className="text-error mr-1" size={16} />
                <span className="text-error text-sm font-medium">-3</span>
                <span className="text-gray-600 text-sm ml-2">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">${metrics?.monthlyRevenue?.toLocaleString() || '0'}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-success" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="text-success mr-1" size={16} />
                <span className="text-success text-sm font-medium">+15%</span>
                <span className="text-gray-600 text-sm ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Hours (This Week)</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics?.teamHours || 0}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-secondary" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="text-success mr-1" size={16} />
                <span className="text-success text-sm font-medium">+12 hrs</span>
                <span className="text-gray-600 text-sm ml-2">overtime</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New quotation created for Container Office Project</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Invoice marked as paid</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Employee time logged: 8.5 hours</p>
                    <p className="text-xs text-gray-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-dashed hover:border-primary hover:bg-primary/5"
                  onClick={() => setShowQuotationModal(true)}
                >
                  <Plus className="text-primary mb-2" size={24} />
                  <span className="text-sm font-medium">New Quotation</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-dashed hover:border-success hover:bg-success/5"
                  onClick={() => setShowTimeModal(true)}
                >
                  <Clock className="text-success mb-2" size={24} />
                  <span className="text-sm font-medium">Log Time</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-dashed hover:border-warning hover:bg-warning/5"
                  onClick={() => setShowServiceModal(true)}
                >
                  <Bolt className="text-warning mb-2" size={24} />
                  <span className="text-sm font-medium">Add Service</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-dashed hover:border-secondary hover:bg-secondary/5"
                  onClick={() => setShowEmployeeModal(true)}
                >
                  <DollarSign className="text-secondary mb-2" size={24} />
                  <span className="text-sm font-medium">Add Employee</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-dashed hover:border-purple-500 hover:bg-purple-50"
                  onClick={() => setShowEmailModal(true)}
                >
                  <Mail className="text-purple-500 mb-2" size={24} />
                  <span className="text-sm font-medium">Send Email</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Inventory Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service Inventory</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.slice(0, 5).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getServiceIcon(service.category)}
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell className="font-medium">${parseFloat(service.price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Employee Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Employee Overview</CardTitle>
            <Button variant="ghost" size="sm">View Payroll</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Daily Salary</TableHead>
                  <TableHead>Overtime Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.slice(0, 4).map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>${parseFloat(employee.dailySalary).toFixed(2)}</TableCell>
                    <TableCell>${parseFloat(employee.overtimeRate).toFixed(2)}/hr</TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TimeModal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)} />
      <QuotationModal isOpen={showQuotationModal} onClose={() => setShowQuotationModal(false)} />
      <EmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} />
      <EmployeeModal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} />
      <ServiceModal isOpen={showServiceModal} onClose={() => setShowServiceModal(false)} />
    </>
  );
}
