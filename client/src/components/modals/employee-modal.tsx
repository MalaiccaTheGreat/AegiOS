import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { insertEmployeeSchema, type InsertEmployee } from "@shared/schema";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
}

export default function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!employee;

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: employee?.name || "",
      email: employee?.email || "",
      role: employee?.role || "",
      dailySalary: employee?.dailySalary || "",
      overtimeRate: employee?.overtimeRate || "",
      isActive: employee?.isActive ?? true,
    },
  });

  const employeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/employees/${employee.id}`, data);
      } else {
        return apiRequest("POST", "/api/employees", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: `Employee ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} employee`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    employeeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter full name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Enter email address"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Job Information */}
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position *</Label>
              <Input
                id="role"
                {...form.register("role")}
                placeholder="e.g., Construction Worker, Supervisor"
              />
              {form.formState.errors.role && (
                <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
              )}
            </div>

            {/* Compensation */}
            <div className="space-y-2">
              <Label htmlFor="dailySalary">Daily Salary (K) *</Label>
              <Input
                id="dailySalary"
                type="number"
                step="0.01"
                {...form.register("dailySalary")}
                placeholder="Enter daily salary"
              />
              {form.formState.errors.dailySalary && (
                <p className="text-sm text-red-500">{form.formState.errors.dailySalary.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Rate (K/hour) *</Label>
              <Input
                id="overtimeRate"
                type="number"
                step="0.01"
                {...form.register("overtimeRate")}
                placeholder="Enter overtime hourly rate"
              />
              {form.formState.errors.overtimeRate && (
                <p className="text-sm text-red-500">{form.formState.errors.overtimeRate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={employeeMutation.isPending}
            >
              {employeeMutation.isPending ? "Saving..." : (isEditing ? "Update Employee" : "Add Employee")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}