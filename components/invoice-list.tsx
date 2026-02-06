"use client";

import { useState, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supportedChains } from "@/lib/chains";
import {
  Invoice,
  getInvoicesByCreator,
  getPaymentLink,
  cancelInvoice,
  formatInvoiceStatus,
} from "@/lib/invoices";

interface InvoiceListProps {
  refreshKey?: number;
}

export function InvoiceList({ refreshKey }: InvoiceListProps) {
  const { address, isConnected } = useAccount();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Derive invoices from address and refreshKey
  const invoices = useMemo(() => {
    // updateTrigger is used to force re-computation after cancel
    // refreshKey is used to trigger refresh from parent component
    void updateTrigger;
    void refreshKey;
    if (!address) return [];
    return getInvoicesByCreator(address);
  }, [address, refreshKey, updateTrigger]);

  const handleCopyLink = async (invoiceId: string) => {
    const link = getPaymentLink(invoiceId);
    await navigator.clipboard.writeText(link);
    toast.success("Payment link copied to clipboard");
  };

  const handleCancel = useCallback((invoiceId: string) => {
    const updated = cancelInvoice(invoiceId);
    if (updated) {
      setUpdateTrigger((prev) => prev + 1);
      toast.success("Invoice cancelled");
    }
  }, []);

  const getChainName = (chainId: number) => {
    return supportedChains.find((c) => c.id === chainId)?.name || "Unknown";
  };

  const getStatusVariant = (status: Invoice["status"]) => {
    const variants: Record<Invoice["status"], "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default",
      expired: "destructive",
      cancelled: "outline",
    };
    return variants[status];
  };

  if (!isConnected) {
    return null;
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No invoices yet. Create your first invoice above.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Invoices</CardTitle>
        <CardDescription>Manage your payment requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invoices.map((invoice, index) => (
          <div key={invoice.id}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-2xl font-bold">{invoice.amount} USDC</p>
                  <p className="text-sm text-muted-foreground">
                    Receive on: {getChainName(invoice.recipientChainId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {formatInvoiceStatus(invoice.status)}
                </Badge>
              </div>

              {invoice.status === "paid" && invoice.txHash && (
                <div className="text-sm text-muted-foreground">
                  <p>Paid by: {invoice.paidBy?.slice(0, 6)}...{invoice.paidBy?.slice(-4)}</p>
                  <p>From: {getChainName(invoice.sourceChainId || 0)}</p>
                </div>
              )}

              {invoice.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(invoice.id)}
                  >
                    Copy Payment Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(invoice.id)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
