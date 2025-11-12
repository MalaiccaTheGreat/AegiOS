import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { ProjectStatus } from '@shared/schema';

interface ProjectListProps {
  businessId: string;
}

const statusVariant = {
  [ProjectStatus.Planning]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.Active]: 'bg-green-100 text-green-800',
  [ProjectStatus.OnHold]: 'bg-yellow-100 text-yellow-800',
  [ProjectStatus.Completed]: 'bg-purple-100 text-purple-800',
  [ProjectStatus.Cancelled]: 'bg-red-100 text-red-800',
};

export default function ProjectList({ businessId }: ProjectListProps) {
  const [location, navigate] = useLocation();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['construction-projects', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/construction/projects?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project: any) => (
              <TableRow 
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.client?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Badge className={statusVariant[project.status as keyof typeof statusVariant]}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={project.progress || 0} className="h-2" />
                    <span className="text-sm text-muted-foreground">
                      {Math.round(project.progress || 0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.startDate ? format(new Date(project.startDate), 'PP') : 'N/A'}
                </TableCell>
                <TableCell>
                  {project.deadline ? format(new Date(project.deadline), 'PP') : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No projects found. Create a new project to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
