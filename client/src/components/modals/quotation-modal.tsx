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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Client, Service } from "@shared/schema";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuotationItem {
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function QuotationModal({ isOpen, onClose }: QuotationModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    quotationNumber: `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    validUntil: "",
    notes: "",
  });
  const [items, setItems] = useState<QuotationItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: isOpen,
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * 0.1; // 10% tax
      const total = subtotal + taxAmount;

      return apiRequest("POST", "/api/quotations", {
        ...data,
        clientId: parseInt(data.clientId),
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        items: items.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          total: item.total.toString(),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      quotationNumber: `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      validUntil: "",
      notes: "",
    });
    setItems([]);
  };

  const addItem = () => {
    setItems([...items, {
      serviceId: 0,
      serviceName: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }]);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === "serviceId") {
      const service = services.find(s => s.id === parseInt(value));
      if (service) {
        updatedItems[index].serviceName = service.name;
        updatedItems[index].unitPrice = parseFloat(service.price);
      }
    }
    
    if (field === "quantity" || field === "unitPrice") {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.clientId || items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a client and add at least one item",
        variant: "destructive",
      });
      return;
    }

    createQuotationMutation.mutate(formData);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * 0.1;
  const total = subtotal + taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client:</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quotationNumber">Quotation Number:</Label>
              <Input
                id="quotationNumber"
                value={formData.quotationNumber}
                onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validUntil">Valid Until:</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button onClick={addItem} size="sm">
                <Plus size={16} className="mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-4">
                        <Label>Service:</Label>
                        <Select 
                          value={item.serviceId.toString()} 
                          onValueChange={(value) => updateItem(index, "serviceId", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Quantity:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Unit Price:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Total:</Label>
                        <Input
                          type="number"
                          value={item.total.toFixed(2)}
                          readOnly
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes:</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-end space-y-2 flex-col w-64 ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createQuotationMutation.isPending}>
              {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
