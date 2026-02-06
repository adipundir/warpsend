"use client";

import { useState } from "react";
import { CreateInvoice } from "@/components/create-invoice";
import { InvoiceList } from "@/components/invoice-list";

export default function InvoicesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInvoiceCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoices & Payment Links</h1>
        <p className="text-muted-foreground max-w-md">
          Create payment links to receive USDC from anyone on any chain.
        </p>
      </div>
      <div className="w-full max-w-lg space-y-6">
        <CreateInvoice onCreated={handleInvoiceCreated} />
        <InvoiceList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
