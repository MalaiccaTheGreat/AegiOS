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
import QuotationTemplate from "@/components/templates/quotation-template";
import type { Quotation, QuotationItem, Client } from "@shared/schema";

interface QuotationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation & { items: QuotationItem[] };
  client: Client;
}

export default function QuotationPreviewModal({ 
  isOpen, 
  onClose, 
  quotation, 
  client 
}: QuotationPreviewModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Quotation-${quotation.quotationNumber}`,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quotation Preview</DialogTitle>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={16} />
              Print
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <QuotationTemplate 
            ref={componentRef}
            quotation={quotation}
            client={client}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}