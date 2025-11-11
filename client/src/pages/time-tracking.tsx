import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar, Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TimeModal from "@/components/modals/time-modal";
import type { TimeEntry, Employee } from "@shared/schema";

export default function TimeTracking() {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: timeEntries = [], isLoading, error } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", selectedEmployee, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmployee && selectedEmployee !== "all") params.append("employeeId", selectedEmployee);
      if (dateRange.startDate && dateRange.endDate) {
        params.append("startDate", dateRange.startDate);
        params.append("endDate", dateRange.endDate);
      }
      const res = await fetch(`/api/time-entries?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch time entries');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  const calculateTotalHours = () => {
    if (!Array.isArray(timeEntries)) return 0;
    return timeEntries.reduce((total, entry) => total + parseFloat(entry.totalHours || '0'), 0);
  };

  const groupEntriesByEmployee = () => {
    if (!Array.isArray(timeEntries)) return [];
    const grouped = timeEntries.reduce((acc, entry) => {
      const employeeName = getEmployeeName(entry.employeeId);
      if (!acc[employeeName]) {
        acc[employeeName] = [];
      }
      acc[employeeName].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);

    return Object.entries(grouped).map(([name, entries]) => ({
      name,
      totalHours: entries.reduce((sum, entry) => sum + parseFloat(entry.totalHours || '0'), 0),
      entries: entries.length,
    }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading time entries...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading time entries</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Tracking</h2>
            <p className="text-gray-600">Monitor and manage employee work hours</p>
          </div>
          <Button onClick={() => setShowTimeModal(true)}>
            <Plus size={16} className="mr-2" />
            Log Time
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours (Period)</p>
                  <p className="text-3xl font-bold text-gray-900">{calculateTotalHours().toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-3xl font-bold text-gray-900">{Array.isArray(timeEntries) ? timeEntries.length : 0}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-3xl font-bold text-gray-900">{groupEntriesByEmployee().length}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Filter className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Average Hours/Day</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupEntriesByEmployee().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No time entries found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  groupEntriesByEmployee().map((summary) => (
                    <TableRow key={summary.name}>
                      <TableCell className="font-medium">{summary.name}</TableCell>
                      <TableCell>{summary.totalHours.toFixed(1)} hrs</TableCell>
                      <TableCell>{summary.entries}</TableCell>
                      <TableCell>{(summary.totalHours / summary.entries).toFixed(1)} hrs</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Time Entries Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(timeEntries) || timeEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No time entries found. Start by logging some time.
                    </TableCell>
                  </TableRow>
                ) : (
                  timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(entry.employeeId)}
                      </TableCell>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.startTime}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.endTime}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {parseFloat(entry.totalHours).toFixed(1)} hrs
                      </TableCell>
                      <TableCell>{entry.projectName || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.notes || "No notes"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TimeModal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)} />
    </>
  );
}
