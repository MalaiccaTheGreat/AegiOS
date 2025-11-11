import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Employee } from "@shared/schema";

interface TimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimeModal({ isOpen, onClose }: TimeModalProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    projectName: "",
    notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isOpen,
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Calculate total hours
      const start = new Date(`${data.date}T${data.startTime}`);
      const end = new Date(`${data.date}T${data.endTime}`);
      const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      return apiRequest("POST", "/api/time-entries", {
        ...data,
        employeeId: parseInt(data.employeeId),
        totalHours: totalHours.toFixed(2),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Success",
        description: "Time entry logged successfully",
      });
      onClose();
      setFormData({
        employeeId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        projectName: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log time entry",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.startTime || !formData.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTimeEntryMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="employee">Employee:</Label>
            <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date">Date:</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time:</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time:</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="project">Project:</Label>
            <Input
              id="project"
              placeholder="Project name"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes:</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Optional notes about the work performed..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createTimeEntryMutation.isPending}>
              {createTimeEntryMutation.isPending ? "Logging..." : "Log Time"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
