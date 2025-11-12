import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/contexts/ProjectContext';
import { format } from 'date-fns';
import { FileText, Plus } from 'lucide-react';
import { useLocation } from 'wouter';

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  total: number;
  client_name: string;
}

export function ProjectInvoices({ projectId }: { projectId: number }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getProjectInvoices } = useProjects();
  const [location, navigate] = useLocation();

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const invoiceData = await getProjectInvoices(projectId);
        setInvoices(invoiceData);
      } catch (err) {
        console.error('Error loading invoices:', err);
        setError('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [projectId, getProjectInvoices]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading invoices</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invoices</h3>
        <Button size="sm" onClick={() => navigate(`/invoices/new?projectId=${projectId}`)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No invoices</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new invoice.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate(`/invoices/new?projectId=${projectId}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusVariant(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${invoice.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
