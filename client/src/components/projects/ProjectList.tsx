import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ProjectStatus, Project } from '@shared/schema';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const statusVariant = {
  [ProjectStatus.Planning]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.Active]: 'bg-green-100 text-green-800',
  [ProjectStatus.OnHold]: 'bg-yellow-100 text-yellow-800',
  [ProjectStatus.Completed]: 'bg-purple-100 text-purple-800',
  [ProjectStatus.Cancelled]: 'bg-red-100 text-red-800',
};

export function ProjectList() {
  const { projects, loading, error, deleteProject, refreshProjects } = useProjects();
  const { subscribe, isConnected } = useWebSocket();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('project:updated', (updatedProject: Project) => {
      toast.success(`Project "${updatedProject.name}" was updated`);
      refreshProjects();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, isConnected, refreshProjects]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshProjects();
      toast.success('Projects refreshed');
    } catch (error) {
      console.error('Error refreshing projects:', error);
      toast.error('Failed to refresh projects');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/projects/${id}/edit`);
  };

  const handleView = (id: number) => {
    navigate(`/projects/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setDeletingId(id);
        await deleteProject(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">Projects</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
            <Button onClick={() => navigate('/projects/new')}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mt-2">Get started by creating a new project.</p>
            <Button className="mt-4" onClick={() => navigate('/projects/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Target End</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/50">
                    <TableCell 
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => handleView(project.id)}
                    >
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusVariant[project.status as keyof typeof statusVariant]}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.target_end_date)}</TableCell>
                    <TableCell>
                      {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleView(project.id)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(project.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                      >
                        {deletingId === project.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
