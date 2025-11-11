import { forwardRef } from "react";
import type { Invoice, InvoiceItem, Client } from "@shared/schema";

interface InvoiceTemplateProps {
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, client }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:shadow-none">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">BLACKMOUNTAIN ENTERPRISE</h1>
          <p className="text-sm mb-4">
            Suppliers of: Construction, Electrical Installations, Property Maintenance, Labour Hire and General Dealing
          </p>
          <div className="flex justify-between text-sm mb-6">
            <div className="text-left">
              <p>P.O BOX 22070</p>
              <p>Kitwe</p>
              <p>Zambia</p>
            </div>
            <div className="text-center">
              <p>TPIN: 1000268843</p>
            </div>
            <div className="text-right">
              <p>Mobile: +260955 272 890</p>
              <p>+260966272892</p>
              <p>Email: blackmountain71@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold">INVOICE</h2>
        </div>

        {/* Client and Invoice Info */}
        <div className="flex justify-between mb-8">
          <div>
            <p><strong>Client:</strong> {client.name}</p>
            <p><strong>Order Number:</strong></p>
          </div>
          <div className="text-right">
            <p><strong>No:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Customer TPIN:</strong></p>
            <p><strong>DATE:</strong> {new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-2 font-bold">Item</th>
                <th className="text-left py-2 font-bold">Description</th>
                <th className="text-center py-2 font-bold">Qty</th>
                <th className="text-right py-2 font-bold">Unit Price</th>
                <th className="text-right py-2 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-4">{index + 1}</td>
                  <td className="py-4">Service Item</td>
                  <td className="text-center py-4">{item.quantity}</td>
                  <td className="text-right py-4">{item.unitPrice.toLocaleString()}</td>
                  <td className="text-right py-4">{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="text-right mb-12">
          <div className="inline-block">
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">TOTAL (K) {invoice.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between">
          <div>
            <p><strong>Prepared By:</strong> NJEKWA AONGOLA</p>
            <p className="mt-8"><strong>Sign:</strong> AS</p>
          </div>
          <div>
            <p><strong>Received By:</strong> …………………………………………..</p>
            <p className="mt-8"><strong>Sign:</strong> …………………………………………………..</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = "InvoiceTemplate";

export default InvoiceTemplate;