import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, FileText, ImageIcon } from 'lucide-react';

interface ProjectDetails {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  deadline: string;
  client: {
    id: number;
    name: string;
    email: string;
  };
  milestones: Array<{
    id: number;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'delayed';
    dueDate: string;
    completedAt?: string;
  }>;
  recentUpdates: Array<{
    id: number;
    title: string;
    description: string;
    date: string;
    type: 'update' | 'milestone' | 'issue';
  }>;
  documents: Array<{
    id: number;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  photos: Array<{
    id: number;
    url: string;
    caption?: string;
    date: string;
  }>;
}

interface ClientPortalProps {
  businessId: string;
}

export default function ClientPortal({ businessId }: ClientPortalProps) {
  const { projectId } = useParams();
  
  const { data: project, isLoading } = useQuery<ProjectDetails>({
    queryKey: ['client-project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/construction/projects/${projectId}/client-view`);
      if (!response.ok) throw new Error('Failed to fetch project details');
      return response.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground">
          The requested project could not be found or you don't have permission to view it.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Team
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project Progress</CardTitle>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('-', ' ')}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Start Date</div>
                <div className="font-medium">
                  {format(new Date(project.startDate), 'MMMM d, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Deadline</div>
                <div className="font-medium">
                  {format(new Date(project.deadline), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="updates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-4">
          {project.recentUpdates.length > 0 ? (
            <div className="space-y-4">
              {project.recentUpdates.map((update) => (
                <Card key={update.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(update.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{update.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">No updates available yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones">
          <div className="space-y-4">
            {project.milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{milestone.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Due: </span>
                        <span>{format(new Date(milestone.dueDate), 'MMM d, yyyy')}</span>
                        {milestone.completedAt && (
                          <span className="ml-4 text-green-600">
                            Completed on {format(new Date(milestone.completedAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                      {milestone.status.replace('-', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {project.documents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.documents.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.type.toUpperCase()} • {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={doc.url} download>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No documents have been shared yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery">
          {project.photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Project photo'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground">{photo.caption}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(photo.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No photos have been shared yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
