import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { timeEntryService } from '@/services/timeEntryService';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Clock, HardHat, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useBusiness } from '@/contexts/BusinessContext';

// Labor types for construction
const LABOR_TYPES = [
  'assembly',
  'electrical',
  'plumbing',
  'carpentry',
  'masonry',
  'painting',
  'roofing',
  'other',
] as const;

type TimeEntryFormData = {
  date: Date;
  startTime: string;
  endTime: string;
  projectId: string;
  laborType: string;
  description: string;
  isOvertime: boolean;
};

type Project = {
  id: number;
  name: string;
  status: string;
};

export function TimeTracking() {
  const { currentBusiness } = useBusiness();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TimeEntryFormData>({
    defaultValues: {
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      isOvertime: false,
      laborType: '',
    },
  });

  // Watch values for calculations
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const isOvertime = watch('isOvertime');

  // Calculate hours
  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // Handle overnight shifts
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  };

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentBusiness) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects?businessId=${currentBusiness.id}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [currentBusiness, toast]);

  const onSubmit = async (data: TimeEntryFormData) => {
    if (!currentBusiness || !currentBusiness.id) {
      toast({
        title: 'Error',
        description: 'No business selected',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const totalHours = calculateHours();
      const isOvertime = data.isOvertime || totalHours > 8; // Auto-detect overtime if > 8 hours
      
      const { regularHours, overtimeHours } = timeEntryService.calculateRegularAndOvertimeHours(
        totalHours,
        isOvertime
      );
      
      await timeEntryService.createTimeEntry({
        businessId: currentBusiness.id,
        employeeId: currentBusiness.employeeId || 0, // You'll need to get the current employee ID from your auth context
        projectId: data.projectId ? parseInt(data.projectId) : null,
        date: data.date.toISOString().split('T')[0],
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        laborType: data.laborType,
        isOvertime,
        regularHours,
        overtimeHours,
      });
      
      toast({
        title: 'Success',
        description: 'Time entry saved successfully',
      });
      
      // Reset form
      reset({
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        description: '',
        projectId: '',
        laborType: '',
        isOvertime: false,
      });
      
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save time entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = calculateHours();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Entry</h2>
          <p className="text-muted-foreground">
            Log your working hours and track time spent on projects
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !watch('date') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('date') ? format(watch('date'), 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch('date')}
                  onSelect={(date) => date && setValue('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="projectId">Project (Optional)</Label>
            <Select
              onValueChange={(value) => setValue('projectId', value)}
              value={watch('projectId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : projects.length > 0 ? (
                  <>
                    <SelectItem value="">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name} ({project.status})
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    No projects found. Create a project first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Time Inputs */}
          <div className="space-y-2">
            <Label>Time</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs text-muted-foreground">
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    className="pl-10"
                    {...register('startTime', { required: 'Start time is required' })}
                  />
                </div>
                {errors.startTime && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs text-muted-foreground">
                  End Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="time"
                    className="pl-10"
                    {...register('endTime', { required: 'End time is required' })}
                  />
                </div>
                {errors.endTime && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
            
            {/* Total Hours */}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-muted-foreground">Total Hours:</span>
              <span className="font-medium">{totalHours.toFixed(2)} hours</span>
            </div>
            
            {/* Overtime Toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isOvertime"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={isOvertime}
                onChange={(e) => setValue('isOvertime', e.target.checked)}
              />
              <Label htmlFor="isOvertime" className="text-sm font-medium">
                Mark as Overtime (1.5x rate)
              </Label>
            </div>
            {totalHours > 8 && !isOvertime && (
              <p className="text-sm text-amber-600">
                Note: This entry will be counted as overtime (over 8 hours)
              </p>
            )}
          </div>
          
          {/* Labor Type */}
          <div className="space-y-2">
            <Label htmlFor="laborType">Labor Type</Label>
            <Select
              onValueChange={(value) => setValue('laborType', value)}
              value={watch('laborType')}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <HardHat className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select labor type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {LABOR_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.laborType && (
              <p className="text-sm font-medium text-destructive">
                {errors.laborType.message}
              </p>
            )}
          </div>
          
          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Work Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the work performed..."
              className="min-h-[100px]"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-sm font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Time Entry'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
