import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2, Trash2, PackagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface Material {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  cost: number;
  projectId?: number;
  projectName?: string;
  createdAt: string;
}

interface MaterialTrackerProps {
  businessId: string;
}

export default function MaterialTracker({ businessId }: MaterialTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  // Fetch materials
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/construction/materials?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    },
  });

  // Fetch projects for the filter dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', businessId],
    queryFn: async () => {
      const response = await fetch(`/api/projects?businessId=${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  // Add new material
  const addMaterial = useMutation({
    mutationFn: async (newMaterial: Omit<Material, 'id' | 'createdAt'>) => {
      const response = await fetch('/api/construction/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      });
      if (!response.ok) throw new Error('Failed to add material');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', businessId] });
      toast({
        title: 'Success',
        description: 'Material added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete material
  const deleteMaterial = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/construction/materials/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete material');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', businessId] });
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter materials based on search and project
  const filteredMaterials = materials.filter((material: Material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || material.projectId === parseInt(selectedProject);
    return matchesSearch && matchesProject;
  });

  // Calculate total value
  const totalValue = filteredMaterials.reduce(
    (sum: number, material: Material) => sum + (material.cost * material.quantity),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project: any) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="whitespace-nowrap">
          <PackagePlus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materials Inventory</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total Value: <span className="font-semibold">${totalValue.toFixed(2)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material: Material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.description || 'No description'}
                  </TableCell>
                  <TableCell>{material.quantity} {material.unit}</TableCell>
                  <TableCell>${material.cost.toFixed(2)}</TableCell>
                  <TableCell>${(material.quantity * material.cost).toFixed(2)}</TableCell>
                  <TableCell>
                    {material.projectName || 'General Inventory'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(material.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMaterial.mutate(material.id)}
                      disabled={deleteMaterial.isLoading}
                    >
                      {deleteMaterial.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMaterials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || selectedProject !== 'all'
                      ? 'No materials match your filters.'
                      : 'No materials found. Add your first material to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{filteredMaterials.length}</strong> of <strong>{materials.length}</strong> materials
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
