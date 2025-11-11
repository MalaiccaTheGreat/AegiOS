import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjects } from '@/contexts/ProjectContext';
import { format } from 'date-fns';
import { Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimeEntry {
  id: number;
  date: string;
  employee_name: string;
  hours: number;
  description: string;
  rate: number;
  total: number;
}

export function ProjectTimeEntries({ projectId }: { projectId: number }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getProjectTimeEntries } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        setLoading(true);
        const entries = await getProjectTimeEntries(projectId);
        setTimeEntries(entries);
      } catch (err) {
        console.error('Error loading time entries:', err);
        setError('Failed to load time entries');
      } finally {
        setLoading(false);
      }
    };

    loadTimeEntries();
  }, [projectId, getProjectTimeEntries]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading time entries</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Entries</h3>
        <Button size="sm" onClick={() => navigate(`/time-entries/new?projectId=${projectId}`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Entry
        </Button>
      </div>

      {timeEntries.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No time entries</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding a new time entry.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate(`/time-entries/new?projectId=${projectId}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow 
                  key={entry.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/time-entries/${entry.id}`)}
                >
                  <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.employee_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                  <TableCell className="text-right">{entry.hours.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${entry.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${entry.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
