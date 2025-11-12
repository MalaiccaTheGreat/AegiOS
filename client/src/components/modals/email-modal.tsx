import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@shared/schema";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const response = await fetch('/api/email-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch email templates');
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      return response.json();
    },
    onError: (error) => {
      console.error('Error fetching email templates:', error);
      toast.error('Failed to load email templates');
    },
    enabled: isOpen,
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      to: formData.to,
      subject: template.subject,
      message: template.body,
    });
  };

  const handleSendEmail = async () => {
    if (!formData.to || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would implement the actual email sending logic
    toast({
      title: "Success",
      description: "Email sent successfully",
    });
    
    onClose();
    setFormData({ to: "", subject: "", message: "" });
    setSelectedTemplate(null);
  };

  const handleSaveDraft = () => {
    toast({
      title: "Success",
      description: "Draft saved successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Management</DialogTitle>
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
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="to">To:</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="client@email.com"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject:</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message:</Label>
                <Textarea
                  id="message"
                  rows={8}
                  placeholder="Your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={handleSendEmail}>
                  Send Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
