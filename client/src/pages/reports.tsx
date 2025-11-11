import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Service, Employee, Quotation, Invoice, PayrollRecord, QuotationItem, InvoiceItem } from "@shared/schema";

export default function Reports() {
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: payrollRecords = [] } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll"],
  });

  const { data: quotationItems = [] } = useQuery<QuotationItem[]>({
    queryKey: ["/api/quotation-items"],
  });

  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["/api/invoice-items"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  // Calculate business metrics
  const businessMetrics = {
    totalRevenue: invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0),
    paidRevenue: invoices.filter(i => i.status === "paid").reduce((sum, invoice) => sum + parseFloat(invoice.total), 0),
    pendingRevenue: invoices.filter(i => i.status === "pending").reduce((sum, invoice) => sum + parseFloat(invoice.total), 0),
    totalQuotations: quotations.length,
    approvedQuotations: quotations.filter(q => q.status === "approved").length,
    conversionRate: quotations.length > 0 ? (quotations.filter(q => q.status === "approved").length / quotations.length) * 100 : 0,
    totalPayroll: payrollRecords.reduce((sum, record) => sum + parseFloat(record.totalPay), 0),
    activeEmployees: employees.filter(e => e.isActive).length,
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
  };

  // Service performance analysis
  const servicePerformance = services.map(service => {
    const approvedQuotationIds = quotations
      .filter(q => q.status === "approved")
      .map(q => q.id);

    const timesQuoted = quotationItems.filter(item =>
      item.serviceId === service.id && approvedQuotationIds.includes(item.quotationId)
    ).length;

    const paidInvoiceIds = invoices
      .filter(i => i.status === "paid")
      .map(i => i.id);

    const revenue = invoiceItems
      .filter(item => item.serviceId === service.id && paidInvoiceIds.includes(item.invoiceId))
      .reduce((sum, item) => sum + parseFloat(item.total), 0);
    
    return {
      ...service,
      timesQuoted,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Employee performance (based on payroll records)
  const employeePerformance = employees.map(employee => {
    const employeePayroll = payrollRecords.filter(record => record.employeeId === employee.id);
    const totalHours = employeePayroll.reduce((sum, record) => 
      sum + parseFloat(record.regularHours) + parseFloat(record.overtimeHours), 0
    );
    const totalPay = employeePayroll.reduce((sum, record) => sum + parseFloat(record.totalPay), 0);
    
    return {
      ...employee,
      totalHours,
      totalPay,
      averageHoursPerMonth: employeePayroll.length > 0 ? totalHours / employeePayroll.length : 0,
    };
  }).sort((a, b) => b.totalPay - a.totalPay);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>
        <Button>
          <Download size={16} className="mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${businessMetrics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="text-success mr-1" size={16} />
              <span className="text-success text-sm font-medium">Revenue Growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {businessMetrics.totalRevenue > 0 ? ((businessMetrics.paidRevenue / businessMetrics.totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-success" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">
                ${businessMetrics.paidRevenue.toLocaleString()} collected
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{businessMetrics.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <FileText className="text-warning" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">
                {businessMetrics.approvedQuotations} of {businessMetrics.totalQuotations} approved
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Efficiency</p>
                <p className="text-3xl font-bold text-gray-900">{businessMetrics.activeEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="text-secondary" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">Active employees</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Services by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicePerformance.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                <div>
                  <p className="font-medium text-success">Collected Revenue</p>
                  <p className="text-sm text-gray-600">{invoices.filter(i => i.status === "paid").length} invoices</p>
                </div>
                <p className="text-xl font-bold text-success">${businessMetrics.paidRevenue.toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium text-warning">Pending Revenue</p>
                  <p className="text-sm text-gray-600">{invoices.filter(i => i.status === "pending").length} invoices</p>
                </div>
                <p className="text-xl font-bold text-warning">${businessMetrics.pendingRevenue.toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-error/10 rounded-lg">
                <div>
                  <p className="font-medium text-error">Overdue Revenue</p>
                  <p className="text-sm text-gray-600">{invoices.filter(i => i.status === "overdue").length} invoices</p>
                </div>
                <p className="text-xl font-bold text-error">
                  ${invoices.filter(i => i.status === "overdue").reduce((sum, invoice) => sum + parseFloat(invoice.total), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Business Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-gray-600">Current Month</p>
                  <p className="text-2xl font-bold text-primary">{metrics?.activeProjects || 0}</p>
                  <p className="text-xs text-gray-500">Active Projects</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <p className="text-sm text-gray-600">Team Hours</p>
                  <p className="text-2xl font-bold text-secondary">{metrics?.teamHours || 0}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-gray-900">${businessMetrics.totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-gray-500">All employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Times Quoted</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicePerformance.slice(0, 10).map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{service.timesQuoted}</TableCell>
                  <TableCell className="font-medium">${service.revenue.toLocaleString()}</TableCell>
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

      {/* Employee Performance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Avg Hours/Month</TableHead>
                <TableHead>Total Compensation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeePerformance.map((employee) => (
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
                  <TableCell>
                    <Badge variant="outline">{employee.role}</Badge>
                  </TableCell>
                  <TableCell>{employee.totalHours.toFixed(1)}h</TableCell>
                  <TableCell>{employee.averageHoursPerMonth.toFixed(1)}h</TableCell>
                  <TableCell className="font-medium">${employee.totalPay.toLocaleString()}</TableCell>
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
  );
}
