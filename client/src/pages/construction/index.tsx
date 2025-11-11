import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import ProjectList from './ProjectList';
import LaborEfficiency from './LaborEfficiency';
import MaterialTracker from './MaterialTracker';
import ClientPortal from './ClientPortal';

export default function ConstructionDashboard() {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();

  if (!currentBusiness) {
    return <div>Loading business data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construction Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your construction projects and resources
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="efficiency">Labor Efficiency</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="client">Client Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <ProjectList businessId={currentBusiness.id} />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <LaborEfficiency businessId={currentBusiness.id} />
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <MaterialTracker businessId={currentBusiness.id} />
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          <ClientPortal businessId={currentBusiness.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
