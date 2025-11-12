import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Input component removed as it's not being used
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Calculator, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
interface Employee {
  id: string | number;  // Make id accept both string and number
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  hourlyRate?: number;
  salary?: number;
  // Add other employee properties as needed
}

interface PayrollRecord {
  id: string;
  employeeId: string | number;
  month: number;
  year: number;
  regularHours?: number | string;
  overtimeHours?: number | string;
  regularPay?: number | string;
  overtimePay?: number | string;
  totalPay?: number | string;
  baseSalary?: number;
  bonus?: number;
  deductions?: number;
  netPay?: number;
  status?: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
  // Add other payroll record properties as needed
}

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: payrollRecords = [], isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll", selectedMonth, selectedYear],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("month", selectedMonth.toString());
      params.append("year", selectedYear.toString());
      return fetch(`/api/payroll?${params}`).then(res => res.json());
    },
  });

  const calculatePayrollMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payroll/calculate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({
        title: "Success",
        description: "Payroll calculated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate payroll",
        variant: "destructive",
      });
    },
  });

  const getEmployeeName = (employeeId: string | number) => {
    const employee = employees.find(emp => emp.id == employeeId); // Use loose equality for type flexibility
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee";
  };

  const getEmployeeRole = (employeeId: string | number) => {
    const employee = employees.find(emp => emp.id == employeeId); // Use loose equality for type flexibility
    return employee?.role || "Unknown Role";
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const payrollStats = {
    totalEmployees: payrollRecords.length,
    totalRegularHours: payrollRecords.reduce((sum, record) => {
      const hours = typeof record.regularHours === 'number' ? record.regularHours : parseFloat(record.regularHours || '0');
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0),
    totalOvertimeHours: payrollRecords.reduce((sum, record) => {
      const hours = typeof record.overtimeHours === 'number' ? record.overtimeHours : parseFloat(record.overtimeHours || '0');
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0),
    totalRegularPay: payrollRecords.reduce((sum, record) => {
      const pay = typeof record.regularPay === 'number' ? record.regularPay : parseFloat(record.regularPay || '0');
      return sum + (isNaN(pay) ? 0 : pay);
    }, 0),
    totalOvertimePay: payrollRecords.reduce((sum, record) => {
      const pay = typeof record.overtimePay === 'number' ? record.overtimePay : parseFloat(record.overtimePay || '0');
      return sum + (isNaN(pay) ? 0 : pay);
    }, 0),
    totalPay: payrollRecords.reduce((sum, record) => {
      const pay = typeof record.totalPay === 'number' ? record.totalPay : parseFloat(record.totalPay || '0');
      return sum + (isNaN(pay) ? 0 : pay);
    }, 0),
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading payroll records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
          <p className="text-gray-600">Calculate and manage employee payroll with overtime</p>
        </div>
        <Button 
          onClick={() => calculatePayrollMutation.mutate()}
          disabled={calculatePayrollMutation.isPending}
        >
          <Calculator size={16} className="mr-2" />
          {calculatePayrollMutation.isPending ? "Calculating..." : "Calculate Payroll"}
        </Button>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" size={20} />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download size={16} className="mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-3xl font-bold text-gray-900">{payrollStats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(payrollStats.totalRegularHours + payrollStats.totalOvertimeHours).toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Calculator className="text-secondary" size={24} />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <div>Regular: {payrollStats.totalRegularHours.toFixed(1)}h</div>
              <div>Overtime: {payrollStats.totalOvertimeHours.toFixed(1)}h</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Pay</p>
                <p className="text-3xl font-bold text-success">${payrollStats.totalRegularPay.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CreditCard className="text-success" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overtime Pay</p>
                <p className="text-3xl font-bold text-warning">${payrollStats.totalOvertimePay.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <CreditCard className="text-warning" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Payroll Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Total Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Payroll for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h3>
            <p className="text-5xl font-bold text-gray-900 mb-4">
              ${payrollStats.totalPay.toLocaleString()}
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <div>
                <span className="font-medium">Regular: </span>
                ${payrollStats.totalRegularPay.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Overtime: </span>
                ${payrollStats.totalOvertimePay.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Payroll Details */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Regular Hours</TableHead>
                <TableHead>Overtime Hours</TableHead>
                <TableHead>Regular Pay</TableHead>
                <TableHead>Overtime Pay</TableHead>
                <TableHead>Total Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No payroll records found for the selected period. Click "Calculate Payroll" to generate records.
                  </TableCell>
                </TableRow>
              ) : (
                payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getEmployeeName(record.employeeId)
                              .split(' ')
                              .filter(Boolean)
                              .map((n: string) => n[0]?.toUpperCase() || '')
                              .join('')}
                          </span>
                      </div>
                        <span className="font-medium">{getEmployeeName(record.employeeId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getEmployeeRole(record.employeeId)}</TableCell>
                    <TableCell>{typeof record.regularHours === 'number' ? record.regularHours.toFixed(1) : '0.0'}h</TableCell>
                    <TableCell>{typeof record.overtimeHours === 'number' ? record.overtimeHours.toFixed(1) : '0.0'}h</TableCell>
                    <TableCell className="font-medium">
                      ${typeof record.regularPay === 'number' ? record.regularPay.toLocaleString() : '0'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${typeof record.overtimePay === 'number' ? record.overtimePay.toLocaleString() : '0'}
                    </TableCell>
                    <TableCell className="font-bold">
                      ${typeof record.totalPay === 'number' ? record.totalPay.toLocaleString() : '0'}
                    </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

      {/* Payroll Formula Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Calculation Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How overtime is calculated:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Regular Hours: Up to 160 hours per month at daily salary rate</li>
              <li>• Overtime Hours: Any hours beyond 160 in a month</li>
              <li>• Overtime Pay = Overtime Rate × Total Overtime Hours × 1.5</li>
              <li>• Total Pay = Regular Pay + Overtime Pay</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
