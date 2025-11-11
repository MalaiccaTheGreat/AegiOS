import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectProvider } from "@/contexts/ProjectContext";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-6">
      <ProjectList />
    </div>
  );
}

// Wrap the page with the ProjectProvider
export function ProjectsPageWithProviders() {
  return (
    <ProjectProvider>
      <ProjectsPage />
    </ProjectProvider>
  );
}
