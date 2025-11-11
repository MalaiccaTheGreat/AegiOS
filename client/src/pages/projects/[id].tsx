import { useParams } from 'wouter';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { ProjectProvider } from '@/contexts/ProjectContext';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id || isNaN(parseInt(id))) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Invalid Project</h2>
          <p className="mt-2 text-muted-foreground">
            The project ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ProjectDetail />
    </div>
  );
}

// Wrap the page with the ProjectProvider
export function ProjectDetailPageWithProviders() {
  return (
    <ProjectProvider>
      <ProjectDetailPage />
    </ProjectProvider>
  );
}
