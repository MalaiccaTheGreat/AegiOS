import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useBusiness } from "@/contexts/BusinessContext";

const businessSetupSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type BusinessSetupFormValues = z.infer<typeof businessSetupSchema>;

export function BusinessSetup() {
  const [location, navigate] = useLocation();
  const { setCurrentBusiness } = useBusiness();
  const queryClient = useQueryClient();

  const form = useForm<BusinessSetupFormValues>({
    resolver: zodResolver(businessSetupSchema),
    defaultValues: {
      name: "",
      industry: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const createBusiness = useMutation({
    mutationFn: async (data: BusinessSetupFormValues) => {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create business");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentBusiness(data);
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      navigate("/dashboard");
    },
  });

  const onSubmit = (data: BusinessSetupFormValues) => {
    createBusiness.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Up Your Business</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="e.g., Construction, Retail, Services"
                {...form.register("industry")}
              />
              {form.formState.errors.industry && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.industry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                {...form.register("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                {...form.register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Business St, City, Country"
                {...form.register("address")}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createBusiness.isPending}
            >
              {createBusiness.isPending ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
