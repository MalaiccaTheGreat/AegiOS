import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectProvider } from "@/contexts/ProjectContext";

export default function NewProjectPage() {
  return (
    <div className="container mx-auto py-6">
      <ProjectForm />
    </div>
  );
}

// Wrap the page with the ProjectProvider
export function NewProjectPageWithProviders() {
  return (
    <ProjectProvider>
      <NewProjectPage />
    </ProjectProvider>
  );
}
