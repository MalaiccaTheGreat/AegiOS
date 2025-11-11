import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Search, Eye, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuotationModal from "@/components/modals/quotation-modal";
import QuotationPreviewModal from "@/components/modals/quotation-preview-modal";
import type { Quotation, QuotationItem, Client } from "@shared/schema";

export default function Quotations() {
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<(Quotation & { items: QuotationItem[] }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const updateQuotationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/quotations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quotation",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (quotation: Quotation) => {
      const quotationWithItems = await fetch(`/api/quotations/${quotation.id}`).then(res => res.json());
      
      return apiRequest("POST", "/api/invoices", {
        quotationId: quotation.id,
        clientId: quotation.clientId,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        subtotal: quotation.subtotal,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: quotationWithItems.items || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };

  const handleStatusUpdate = (quotationId: number, status: string) => {
    updateQuotationMutation.mutate({
      id: quotationId,
      data: { status }
    });
  };

  const handleCreateInvoice = (quotation: Quotation) => {
    if (quotation.status !== "approved") {
      toast({
        title: "Error",
        description: "Only approved quotations can be converted to invoices",
        variant: "destructive",
      });
      return;
    }
    
    createInvoiceMutation.mutate(quotation);
  };

  const handleViewQuotation = async (quotationId: number) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`);
      const quotationWithItems = await response.json();
      setSelectedQuotation(quotationWithItems);
      setShowPreviewModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getClientName(quotation.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const quotationStats = {
    total: quotations.length,
    pending: quotations.filter(q => q.status === "pending").length,
    approved: quotations.filter(q => q.status === "approved").length,
    rejected: quotations.filter(q => q.status === "rejected").length,
    totalValue: quotations.reduce((sum, q) => sum + parseFloat(q.total), 0),
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading quotations...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quotations</h2>
            <p className="text-gray-600">Manage project quotations and proposals</p>
          </div>
          <Button onClick={() => setShowQuotationModal(true)}>
            <Plus size={16} className="mr-2" />
            New Quotation
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                  <p className="text-3xl font-bold text-gray-900">{quotationStats.total}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-warning">{quotationStats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-success">{quotationStats.approved}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Check className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900">${quotationStats.totalValue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-secondary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search quotations..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quotations List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter ? "No quotations found matching your criteria." : "No quotations found. Create your first quotation to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        {quotation.quotationNumber}
                      </TableCell>
                      <TableCell>{getClientName(quotation.clientId)}</TableCell>
                      <TableCell>
                        {new Date(quotation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(quotation.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(quotation.status)}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {quotation.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(quotation.id, "approved")}
                                disabled={updateQuotationMutation.isPending}
                              >
                                <Check size={16} className="text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(quotation.id, "rejected")}
                                disabled={updateQuotationMutation.isPending}
                              >
                                <X size={16} className="text-error" />
                              </Button>
                            </>
                          )}
                          {quotation.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateInvoice(quotation)}
                              disabled={createInvoiceMutation.isPending}
                            >
                              Create Invoice
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewQuotation(quotation.id)}
                          >
                            <Eye size={16} />
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

      <QuotationModal 
        isOpen={showQuotationModal} 
        onClose={() => setShowQuotationModal(false)} 
      />
      
      {selectedQuotation && (
        <QuotationPreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedQuotation(null);
          }}
          quotation={selectedQuotation}
          client={clients.find(c => c.id === selectedQuotation.clientId)!}
        />
      )}
    </>
  );
}
