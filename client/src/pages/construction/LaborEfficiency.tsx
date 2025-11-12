import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoute } from 'wouter';

interface LaborEfficiencyProps {
  businessId: string;
  projectId?: string;
}

export default function LaborEfficiency({ businessId, projectId }: LaborEfficiencyProps) {
  const { data: efficiencyData = [], isLoading } = useQuery({
    queryKey: ['labor-efficiency', businessId, projectId],
    queryFn: async () => {
      const url = projectId 
        ? `/api/construction/projects/${projectId}/labor-efficiency`
        : `/api/construction/labor-efficiency?businessId=${businessId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch labor efficiency data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-500';
    if (efficiency >= 75) return 'bg-blue-500';
    if (efficiency >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Labor Efficiency</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead>Productive Hours</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {efficiencyData.map((emp: any) => {
              const efficiency = Math.round(emp.efficiency || 0);
              return (
                <TableRow key={emp.employee.id}>
                  <TableCell className="font-medium">
                    {emp.employee.name}
                    <div className="text-sm text-muted-foreground">
                      {emp.employee.position || 'Laborer'}
                    </div>
                  </TableCell>
                  <TableCell>{emp.totalHours.toFixed(1)} hrs</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={efficiency} 
                        className="h-2 [&>div]:bg-green-500"
                      />
                      <span className="w-12 text-right">{efficiency}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{emp.productiveHours.toFixed(1)} hrs</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(efficiency)}/10 text-${getEfficiencyColor(efficiency).split('-')[1]}-800`}>
                      {efficiency >= 90 ? 'Excellent' : efficiency >= 75 ? 'Good' : efficiency >= 50 ? 'Fair' : 'Needs Improvement'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {efficiencyData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No labor data available. Time entries will appear here as they are logged.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
