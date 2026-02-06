"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { PayInvoice } from "@/components/pay-invoice";
import { getInvoiceById } from "@/lib/invoices";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// SSR-safe hook to check if mounted
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function PayInvoicePage() {
  const params = useParams();
  const mounted = useIsMounted();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Derive invoice data from params
  const { invoice, notFound, loading } = useMemo(() => {
    if (!mounted) {
      return { invoice: null, notFound: false, loading: true };
    }
    const id = params.id as string;
    if (!id) {
      return { invoice: null, notFound: true, loading: false };
    }
    // refreshTrigger forces re-computation
    void refreshTrigger;
    const found = getInvoiceById(id);
    return {
      invoice: found,
      notFound: !found,
      loading: false,
    };
  }, [params.id, mounted, refreshTrigger]);

  const handlePaid = () => {
    // Refresh invoice data by triggering re-computation
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card className="w-full max-w-lg">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This invoice doesn&apos;t exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Pay Invoice</h1>
        <p className="text-muted-foreground">
          Complete your payment using USDC from any supported chain
        </p>
      </div>
      <PayInvoice invoice={invoice} onPaid={handlePaid} />
    </div>
  );
}
