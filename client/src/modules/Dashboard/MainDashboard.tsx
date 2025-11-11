import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import BusinessOverview from './BusinessOverview';
import { BusinessSelector } from '@/components/shared/BusinessSelector';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedVirtualAssistant } from '@/components/ai/EnhancedVirtualAssistant';

const MainDashboard = () => {
  const { currentBusiness, businesses, refreshBusinesses, isLoading } = useBusiness();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const handleCommand = async (command: string) => {
    // Handle voice commands
    console.log('Processing command:', command);
    toast({
      title: "Command received",
      description: `Processing: "${command}"`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <BusinessSelector />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refreshBusinesses()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => {}}>
            <Plus className="mr-2 h-4 w-4" />
            Add Business
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsListener>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {currentBusiness ? (
            <BusinessOverview />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Business Selected</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Please select or create a business to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tab contents */}
      </Tabs>

      {/* Voice Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <EnhancedVirtualAssistant
          onCommand={handleCommand}
          isOpen={isAssistantOpen}
          onOpenChange={setIsAssistantOpen}
          position="bottom-right"
          className="shadow-xl rounded-xl overflow-hidden"
          style={{ width: '400px', height: '600px' }}
        />
      </div>
    </div>
  );
};

export default MainDashboard;
