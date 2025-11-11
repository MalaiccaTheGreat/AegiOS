import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/contexts/ProjectContext';
import { DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export function ProjectMetrics({ projectId }: { projectId: number }) {
  const { getProjectMetrics } = useProjects();
  const [metrics, setMetrics] = useState<{
    totalHours: number;
    totalInvoiced: number;
    remainingBudget: number;
    progress: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const data = await getProjectMetrics(projectId);
        setMetrics(data);
      } catch (err) {
        console.error('Error loading project metrics:', err);
        setError('Failed to load project metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [projectId, getProjectMetrics]);

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
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Total hours logged</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalInvoiced.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total amount invoiced</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.remainingBudget.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Budget remaining</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col space-y-2">
          <div className="flex justify-between items-center w-full">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <span className="text-sm font-medium">{Math.round(metrics.progress)}%</span>
          </div>
          <Progress value={metrics.progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {metrics.progress >= 100 ? 'Project completed!' : 'In progress'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
