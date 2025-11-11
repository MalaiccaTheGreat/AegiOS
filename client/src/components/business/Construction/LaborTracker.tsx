import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Types
type LaborType = 'assembly' | 'electrical' | 'plumbing' | 'finishing' | 'other';

interface TimeEntry {
  id?: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  date: Date;
  regularHours: number;
  overtimeHours: number;
  laborType: LaborType;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

interface Project {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

// Mock data - in a real app, this would come from your API
const mockEmployees: Employee[] = [
  { id: '1', name: 'John Doe', role: 'Carpenter', hourlyRate: 35 },
  { id: '2', name: 'Jane Smith', role: 'Electrician', hourlyRate: 40 },
  { id: '3', name: 'Mike Johnson', role: 'Plumber', hourlyRate: 38 },
  { id: '4', name: 'Sarah Williams', role: 'Laborer', hourlyRate: 30 },
];

const mockProjects: Project[] = [
  { id: '1', name: 'Downtown Office Complex', budget: 150000, spent: 87500 },
  { id: '2', name: 'Riverside Apartments', budget: 250000, spent: 187500 },
  { id: '3', name: 'Tech Park Development', budget: 500000, spent: 325000 },
];

const laborTypes: LaborType[] = ['assembly', 'electrical', 'plumbing', 'finishing', 'other'];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function LaborTracker() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekRange, setWeekRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 }),
  });
  const [newEntry, setNewEntry] = useState<Partial<TimeEntry>>({
    employeeId: '',
    projectId: '',
    date: new Date(),
    regularHours: 8,
    overtimeHours: 0,
    laborType: 'assembly',
    notes: '',
  });

  // Fetch time entries for the selected week
  const { data: timeEntries = [], isLoading, error } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', weekRange.start.toISOString(), weekRange.end.toISOString()],
    queryFn: async () => {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/construction/labor/entries?start=${weekRange.start.toISOString()}&end=${weekRange.end.toISOString()}`);
      // return response.json();
      
      // Mock data for demo
      return [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'John Doe',
          projectId: '1',
          date: new Date(),
          regularHours: 8,
          overtimeHours: 2,
          laborType: 'assembly',
          notes: 'Installed wall frames',
        },
        {
          id: '2',
          employeeId: '2',
          employeeName: 'Jane Smith',
          projectId: '1',
          date: new Date(),
          regularHours: 8,
          overtimeHours: 0,
          laborType: 'electrical',
          notes: 'Rough-in electrical',
        },
      ];
    },
  });

  // Calculate weekly summary
  const weeklySummary = timeEntries.reduce(
    (acc, entry) => ({
      totalHours: acc.totalHours + entry.regularHours + entry.overtimeHours,
      regularHours: acc.regularHours + entry.regularHours,
      overtimeHours: acc.overtimeHours + entry.overtimeHours,
      laborCost: acc.laborCost + 
        (entry.regularHours * (mockEmployees.find(e => e.id === entry.employeeId)?.hourlyRate || 0)) +
        (entry.overtimeHours * (mockEmployees.find(e => e.id === entry.employeeId)?.hourlyRate || 0) * 1.5),
    }),
    { totalHours: 0, regularHours: 0, overtimeHours: 0, laborCost: 0 }
  );

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setNewEntry(prev => ({
      ...prev,
      date,
    }));
  };

  // Handle week navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    const newStart = addDays(weekRange.start, days);
    setWeekRange({
      start: newStart,
      end: addDays(newStart, 6),
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would be a mutation that calls your API
    // For now, we'll just log the entry
    console.log('New time entry:', {
      ...newEntry,
      employeeName: mockEmployees.find(e => e.id === newEntry.employeeId)?.name || 'Unknown',
    });
    
    // Reset form
    setNewEntry({
      employeeId: '',
      projectId: '',
      date: new Date(),
      regularHours: 8,
      overtimeHours: 0,
      laborType: 'assembly',
      notes: '',
    });
    
    // Show success message
    // In a real app, you might use a toast notification
    alert('Time entry added successfully!');
  };

  // Handle entry deletion
  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      // In a real app, this would be a mutation that calls your API
      console.log('Delete time entry:', id);
      
      // Show success message
      // In a real app, you might use a toast notification
      alert('Time entry deleted successfully!');
    }
  };

  // Calculate daily totals
  const getDailyTotal = (date: Date) => {
    return timeEntries
      .filter(entry => isSameDay(new Date(entry.date), date))
      .reduce((total, entry) => total + entry.regularHours + entry.overtimeHours, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Labor Tracker</h1>
          <p className="text-muted-foreground">
            Track and manage labor hours for your construction projects
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Time Entry
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load time entries'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Time Entries</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setWeekRange({
                    start: startOfWeek(today, { weekStartsOn: 0 }),
                    end: endOfWeek(today, { weekStartsOn: 0 }),
                  });
                }}
              >
                This Week
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No time entries found</h3>
                <p className="text-sm text-muted-foreground">
                  Add a new time entry to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Regular</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => {
                    const employee = mockEmployees.find(e => e.id === entry.employeeId);
                    const project = mockProjects.find(p => p.id === entry.projectId);
                    const totalHours = entry.regularHours + entry.overtimeHours;
                    const laborCost = (entry.regularHours * (employee?.hourlyRate || 0)) + 
                                    (entry.overtimeHours * (employee?.hourlyRate || 0) * 1.5);
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{entry.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{employee?.role}</div>
                        </TableCell>
                        <TableCell>
                          {project?.name || 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {entry.laborType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.regularHours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.overtimeHours > 0 ? (
                            <span className="text-amber-500">+{entry.overtimeHours.toFixed(1)}h</span>
                          ) : (
                            <span className="text-muted-foreground">0h</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {totalHours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.notes}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => entry.id && handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Time Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee</Label>
                  <Select
                    value={newEntry.employeeId}
                    onValueChange={(value) => handleInputChange('employeeId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={newEntry.projectId}
                    onValueChange={(value) => handleInputChange('projectId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !newEntry.date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEntry.date ? (
                          format(newEntry.date, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newEntry.date}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regularHours">Regular Hours</Label>
                    <Input
                      id="regularHours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      value={newEntry.regularHours || ''}
                      onChange={(e) => handleInputChange('regularHours', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeHours">Overtime Hours</Label>
                    <Input
                      id="overtimeHours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      value={newEntry.overtimeHours || 0}
                      onChange={(e) => handleInputChange('overtimeHours', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laborType">Labor Type</Label>
                  <Select
                    value={newEntry.laborType}
                    onValueChange={(value: LaborType) => handleInputChange('laborType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select labor type" />
                    </SelectTrigger>
                    <SelectContent>
                      {laborTypes.map((type) => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    placeholder="Add any notes or details"
                    value={newEntry.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Entry
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-medium">{weeklySummary.totalHours.toFixed(1)}h</span>
                </div>
                <Progress
                  value={(weeklySummary.totalHours / (40 + 16)) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0h</span>
                  <span>56h</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Regular Hours</span>
                  <span className="text-sm font-medium">
                    {weeklySummary.regularHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Overtime Hours</span>
                  <span className="text-sm font-medium text-amber-500">
                    +{weeklySummary.overtimeHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Labor Cost</span>
                  <span className="font-medium">
                    {formatCurrency(weeklySummary.laborCost)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
