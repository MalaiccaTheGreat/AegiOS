import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Plus, Edit2, Trash2, Send, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { EmailTemplate, Client } from "@shared/schema";

export default function Email() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    type: "",
  });
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    message: "",
    templateId: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
      resetTemplateForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create email template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/email-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
      resetTemplateForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    },
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      subject: "",
      body: "",
      type: "",
    });
    setEditingTemplate(null);
    setShowTemplateModal(false);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
    });
    setShowTemplateModal(true);
  };

  const handleSubmitTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body || !templateForm.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setEmailForm({
        ...emailForm,
        templateId,
        subject: template.subject,
        message: template.body,
      });
    }
  };

  const handleSendEmail = () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // In a real application, this would send the email via an email service
    toast({
      title: "Success",
      description: "Email sent successfully",
    });
    
    setEmailForm({
      to: "",
      subject: "",
      message: "",
      templateId: "",
    });
    setShowEmailModal(false);
  };

  const templateTypes = [
    { value: "quotation_followup", label: "Quotation Follow-up" },
    { value: "invoice_reminder", label: "Invoice Reminder" },
    { value: "project_update", label: "Project Update" },
    { value: "welcome", label: "Welcome Message" },
    { value: "completion", label: "Project Completion" },
  ];

  const getTypeLabel = (type: string) => {
    const typeObj = templateTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "quotation_followup":
        return "default";
      case "invoice_reminder":
        return "destructive";
      case "project_update":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading email templates...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Management</h2>
            <p className="text-gray-600">Manage email templates and send professional communications</p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus size={16} className="mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button onClick={() => setShowEmailModal(true)}>
              <Send size={16} className="mr-2" />
              Compose Email
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Follow-up Templates</p>
                  <p className="text-3xl font-bold text-primary">
                    {templates.filter(t => t.type === "quotation_followup").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reminder Templates</p>
                  <p className="text-3xl font-bold text-error">
                    {templates.filter(t => t.type === "invoice_reminder").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <Mail className="text-error" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Update Templates</p>
                  <p className="text-3xl font-bold text-secondary">
                    {templates.filter(t => t.type === "project_update").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Mail className="text-secondary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No email templates found. Create your first template to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(template.type)}>
                          {getTypeLabel(template.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Email Template" : "Create New Email Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Quotation Follow-up"
                />
              </div>
              <div>
                <Label htmlFor="templateType">Type *</Label>
                <Select value={templateForm.type} onValueChange={(value) => setTemplateForm({ ...templateForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="templateSubject">Subject Line *</Label>
              <Input
                id="templateSubject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g., Follow-up on Your Container Home Quotation"
              />
            </div>
            
            <div>
              <Label htmlFor="templateBody">Email Body *</Label>
              <Textarea
                id="templateBody"
                rows={10}
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Enter your email template content here..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetTemplateForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTemplate}
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {(createTemplateMutation.isPending || updateTemplateMutation.isPending) 
                  ? "Saving..." 
                  : editingTemplate ? "Update Template" : "Create Template"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Compose Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-1">
              <h4 className="font-medium text-gray-900 mb-4">Email Templates</h4>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectTemplate(template.id.toString())}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailTo">To: *</Label>
                  <Select value={emailForm.to} onValueChange={(value) => setEmailForm({ ...emailForm, to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.email}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="emailSubject">Subject: *</Label>
                  <Input
                    id="emailSubject"
                    placeholder="Email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emailMessage">Message: *</Label>
                  <Textarea
                    id="emailMessage"
                    rows={12}
                    placeholder="Your message here..."
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmail}>
                    <Send size={16} className="mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
