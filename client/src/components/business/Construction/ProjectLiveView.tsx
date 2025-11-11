import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Users, DollarSign, Calendar, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetEndDate: string;
  budget: number;
  spent: number;
  progress: {
    percentage: number;
    completedTasks: number;
    totalTasks: number;
    lastUpdated: string;
  };
  healthScore: number;
  laborStats: {
    totalHours: number;
    totalOvertime: number;
  };
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export function ProjectLiveView() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/construction/projects/${projectId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusBadge = (status: ProjectStatus) => {
    const statusMap = {
      planning: { label: 'Planning', variant: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', variant: 'bg-green-100 text-green-800' },
      on_hold: { label: 'On Hold', variant: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', variant: 'bg-purple-100 text-purple-800' },
      cancelled: { label: 'Cancelled', variant: 'bg-red-100 text-red-800' },
    };
    
    const { label, variant } = statusMap[status] || { label: 'Unknown', variant: 'bg-gray-100 text-gray-800' };
    return <Badge className={`${variant} capitalize`}>{label}</Badge>;
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Healthy', color: 'text-green-500' };
    if (score >= 50) return { label: 'Needs Attention', color: 'text-yellow-500' };
    return { label: 'At Risk', color: 'text-red-500' };
  };

  if (isLoading) {
    return <ProjectSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load project data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const healthStatus = getHealthStatus(project.healthScore);
  const remainingBudget = project.budget - project.spent;
  const budgetPercentage = (project.spent / project.budget) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center space-x-2 mt-2">
            {getStatusBadge(project.status)}
            <span className="text-sm text-muted-foreground">
              Last updated: {format(new Date(project.progress.lastUpdated), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button size="sm">
            <Users className="mr-2 h-4 w-4" />
            Manage Team
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress.percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {project.progress.completedTasks} of {project.progress.totalTasks} tasks completed
                </p>
                <Progress value={project.progress.percentage} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${project.spent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${remainingBudget.toLocaleString()} remaining (${project.budget.toLocaleString()} total)
                </p>
                <Progress value={budgetPercentage} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Labor Hours</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.laborStats.totalHours.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {project.laborStats.totalOvertime.toLocaleString()} overtime hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Health</CardTitle>
                <AlertCircle className={`h-4 w-4 ${healthStatus.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.healthScore}/100</div>
                <p className="text-xs text-muted-foreground">
                  Status: <span className={healthStatus.color}>{healthStatus.label}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start pb-4 border-b">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Project Kickoff</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.startDate), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className="ml-auto" variant="outline">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-start pb-4 border-b">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Design Phase</p>
                      <p className="text-sm text-muted-foreground">In progress</p>
                    </div>
                    <Badge className="ml-auto" variant="secondary">
                      In Progress
                    </Badge>
                  </div>
                  <div className="flex items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Target Completion</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.targetEndDate), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className="ml-auto" variant="outline">
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                    <p className="text-sm">{project.client?.name || 'No client assigned'}</p>
                    {project.client?.email && (
                      <p className="text-sm text-muted-foreground">{project.client.email}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-sm">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Key Dates</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Start: {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Target End: {format(new Date(project.targetEndDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="bg-primary rounded-full p-1 mr-4 mt-1">
                    <div className="h-2 w-2 bg-white rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Project Kickoff</h3>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(project.startDate), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">Project officially started</p>
                  </div>
                </div>
                
                <div className="border-l-2 border-muted pl-6 ml-2">
                  <div className="flex items-start pb-6">
                    <div className="bg-primary rounded-full p-1 mr-4 mt-1">
                      <div className="h-2 w-2 bg-white rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Design Phase</h3>
                        <Badge variant="secondary">In Progress</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Finalizing container office designs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-muted-foreground/20 rounded-full p-1 mr-4 mt-1">
                      <div className="h-2 w-2" />
                    </div>
                    <div className="flex-1 pb-6">
                      <h3 className="font-medium">Procurement</h3>
                      <p className="text-sm text-muted-foreground">Sourcing materials and containers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-muted-foreground/20 rounded-full p-1 mr-4 mt-1">
                      <div className="h-2 w-2" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Assembly</h3>
                      <p className="text-sm text-muted-foreground">Container modification and assembly</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-muted-foreground/20 rounded-full p-1 mr-4 mt-1">
                    <div className="h-2 w-2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Project Completion</h3>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(project.targetEndDate), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">Final inspection and handover</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">JD</span>
                    </div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">Project Manager</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    Admin
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">AS</span>
                    </div>
                    <div>
                      <p className="font-medium">Alex Smith</p>
                      <p className="text-sm text-muted-foreground">Lead Carpenter</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    Member
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">MJ</span>
                    </div>
                    <div>
                      <p className="font-medium">Maria Garcia</p>
                      <p className="text-sm text-muted-foreground">Electrician</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    Member
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Documents</CardTitle>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg divide-y">
                <div className="grid grid-cols-12 items-center p-4">
                  <div className="col-span-6 font-medium">Name</div>
                  <div className="col-span-2 text-sm text-muted-foreground">Type</div>
                  <div className="col-span-2 text-sm text-muted-foreground">Size</div>
                  <div className="col-span-2 text-sm text-muted-foreground">Uploaded</div>
                </div>
                
                <div className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                  <div className="col-span-6 font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    Project_Proposal.pdf
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">PDF</div>
                  <div className="col-span-2 text-sm text-muted-foreground">2.4 MB</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                  <div className="col-span-6 font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-500" />
                    Floor_Plans.dwg
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">CAD</div>
                  <div className="col-span-2 text-sm text-muted-foreground">5.7 MB</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <div className="grid grid-cols-12 items-center p-4 hover:bg-muted/50">
                  <div className="col-span-6 font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-yellow-500" />
                    Material_List.xlsx
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">Excel</div>
                  <div className="col-span-2 text-sm text-muted-foreground">1.1 MB</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {format(new Date(), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Labor Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed breakdown of labor hours and costs for the project.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Budget Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive budget tracking and expense analysis.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Progress Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Current project status, milestones, and key metrics.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                <div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-36 mt-1" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
