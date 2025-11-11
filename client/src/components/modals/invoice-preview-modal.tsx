import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import InvoiceTemplate from "@/components/templates/invoice-template";
import type { Invoice, InvoiceItem, Client } from "@shared/schema";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
}

export default function InvoicePreviewModal({ 
  isOpen, 
  onClose, 
  invoice, 
  client 
}: InvoicePreviewModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${invoice.invoiceNumber}`,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={16} />
              Print
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <InvoiceTemplate 
            ref={componentRef}
            invoice={invoice}
            client={client}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}