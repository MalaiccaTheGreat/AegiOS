import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Clock, FileText, BarChart2, Trash2 } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { ProjectStatus } from '@shared/schema';
import { useToast } from '@/components/ui/use-toast';
import { ProjectTimeEntries } from './ProjectTimeEntries';
import { ProjectInvoices } from './ProjectInvoices';
import { ProjectMetrics } from './ProjectMetrics';

const statusVariant = {
  [ProjectStatus.PLANNING]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800',
  [ProjectStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProject, deleteProject, loading } = useProjects();
  const [project, setProject] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      try {
        const projectData = await getProject(parseInt(id));
        if (projectData) {
          setProject(projectData);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project',
          variant: 'destructive',
        });
      }
    };

    loadProject();
  }, [id, getProject, toast]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProject(parseInt(id));
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="text-muted-foreground mt-2">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusVariant[project.status as keyof typeof statusVariant]}>
                {project.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created on {formatDate(project.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(project.start_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Target End</p>
              <p className="font-medium">{formatDate(project.target_end_date)}</p>
            </div>
            {project.budget && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">${parseFloat(project.budget).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{project.description}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="time-entries">
              <Clock className="h-4 w-4 mr-2" />
              Time Entries
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProjectMetrics projectId={parseInt(id!)} />
          </TabsContent>

          <TabsContent value="time-entries" className="mt-6">
            <ProjectTimeEntries projectId={parseInt(id!)} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <ProjectInvoices projectId={parseInt(id!)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
