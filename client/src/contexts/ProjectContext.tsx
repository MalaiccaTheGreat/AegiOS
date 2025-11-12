import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Project, ProjectStatus } from '@shared/schema';
import { useBusiness } from './BusinessContext';
import { useToast } from '@/components/ui/use-toast';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  getProject: (id: number) => Promise<Project | undefined>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
  updateProject: (id: number, project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  getProjectTimeEntries: (projectId: number) => Promise<any[]>;
  getProjectInvoices: (projectId: number) => Promise<any[]>;
  getProjectMetrics: (projectId: number) => Promise<{
    totalHours: number;
    totalInvoiced: number;
    remainingBudget: number;
    progress: number;
  }>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { currentBusiness } = useBusiness();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!currentBusiness) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects?businessId=${currentBusiness.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, toast]);

  const getProject = useCallback(async (id: number): Promise<Project | undefined> => {
    if (!currentBusiness) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${id}?businessId=${currentBusiness.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setCurrentProject(data);
      return data;
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentBusiness, toast]);

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    if (!currentBusiness) throw new Error('No business selected');
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...project,
          businessId: currentBusiness.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create project');
      }

      const data = await response.json();
      await fetchProjects();
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      return data;
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create project',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: number, project: Partial<Project>): Promise<Project> => {
    if (!currentBusiness) {
      const error = new Error('No business selected. Please select a business first.');
      setError(error.message);
      toast({
        title: 'Business Required',
        description: 'Please select a business before updating a project.',
        variant: 'destructive',
      });
      throw error;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...project,
          businessId: currentBusiness.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update project');
      }

      const data = await response.json();
      await fetchProjects();
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      return data;
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update project',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: number): Promise<void> => {
    if (!currentBusiness) throw new Error('No business selected');
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${id}?businessId=${currentBusiness.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      await fetchProjects();
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProjectTimeEntries = async (projectId: number): Promise<any[]> => {
    if (!currentBusiness) throw new Error('No business selected');
    
    try {
      const response = await fetch(`/api/projects/${projectId}/time-entries?businessId=${currentBusiness.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project time entries');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching project time entries:', err);
      throw err;
    }
  };

  const getProjectInvoices = async (projectId: number): Promise<any[]> => {
    if (!currentBusiness) throw new Error('No business selected');
    
    try {
      const response = await fetch(`/api/projects/${projectId}/invoices?businessId=${currentBusiness.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project invoices');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching project invoices:', err);
      throw err;
    }
  };

  const getProjectMetrics = async (projectId: number) => {
    if (!currentBusiness) throw new Error('No business selected');
    
    try {
      const response = await fetch(`/api/projects/${projectId}/metrics?businessId=${currentBusiness.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project metrics');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching project metrics:', err);
      throw err;
    }
  };

  // Fetch projects when business changes
  useEffect(() => {
    if (currentBusiness) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [currentBusiness, fetchProjects]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        loading,
        error,
        fetchProjects,
        getProject,
        createProject,
        updateProject,
        deleteProject,
        getProjectTimeEntries,
        getProjectInvoices,
        getProjectMetrics,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
