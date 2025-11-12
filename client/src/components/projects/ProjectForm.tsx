import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProjectStatus } from '@shared/schema';
import { useProjects } from '@/contexts/ProjectContext';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  start_date: z.string().optional(),
  target_end_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  budget: z.string().transform(val => val ? parseFloat(val) : null).nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectForm() {
  const [match, params] = useRoute('/projects/:id');
  const id = params?.id;
  const isEditMode = !!id;
  const { createProject, updateProject, getProject, loading } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: ProjectStatus.PLANNING,
      start_date: '',
      target_end_date: '',
      actual_end_date: '',
      budget: null,
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      const loadProject = async () => {
        try {
          const project = await getProject(parseInt(id));
          if (project) {
            form.reset({
              ...project,
              start_date: project.start_date || '',
              target_end_date: project.target_end_date || '',
              actual_end_date: project.actual_end_date || '',
              budget: project.budget ? project.budget.toString() : '',
            });
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          toast({
            title: 'Error',
            description: 'Failed to load project data',
            variant: 'destructive',
          });
        }
      };
      loadProject();
    }
  }, [id, isEditMode, form, getProject, toast]);

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      
      const projectData = {
        ...data,
        start_date: data.start_date || null,
        target_end_date: data.target_end_date || null,
        actual_end_date: data.actual_end_date || null,
        budget: data.budget,
      };

      if (isEditMode && id) {
        await updateProject(parseInt(id), projectData);
        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
      } else {
        await createProject(projectData);
        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Project' : 'Create New Project'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the project details below.'
              : 'Fill in the form to create a new project.'}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ProjectStatus).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Project description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEditMode ? 'Update Project' : 'Create Project'}</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
