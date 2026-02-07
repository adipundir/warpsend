"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supportedChains, arcTestnet } from "@/lib/chains";
import { createInvoice, getPaymentLink } from "@/lib/invoices";

interface CreateInvoiceProps {
  onCreated?: () => void;
}

export function CreateInvoice({ onCreated }: CreateInvoiceProps) {
  const { address, isConnected } = useAccount();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientChain, setRecipientChain] = useState(arcTestnet.id.toString());
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!address || !amount || !description) {
      toast.error("Please fill in all fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setIsCreating(true);

    try {
      const invoice = createInvoice({
        createdBy: address,
        recipientAddress: address,
        recipientChainId: parseInt(recipientChain),
        amount,
        description,
      });

      const paymentLink = getPaymentLink(invoice.id);

      // Copy to clipboard
      await navigator.clipboard.writeText(paymentLink);

      toast.success("Invoice created! Payment link copied to clipboard.");

      setAmount("");
      setDescription("");
      onCreated?.();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to create invoices
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
        <CardDescription>
          Generate a payment link to receive USDC from anyone on any chain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invoice-amount">Amount (USDC)</Label>
          <Input
            id="invoice-amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isCreating}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice-description">Description</Label>
          <Input
            id="invoice-description"
            placeholder="Payment for services..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <div className="space-y-2">
          <Label>Receive On Chain</Label>
          <Select value={recipientChain} onValueChange={setRecipientChain} disabled={isCreating}>
            <SelectTrigger>
              <SelectValue placeholder="Select chain" />
            </SelectTrigger>
            <SelectContent>
              {supportedChains.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            You&apos;ll receive USDC on this chain regardless of which chain the payer uses
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleCreate}
          disabled={isCreating || !amount || !description}
        >
          {isCreating ? "Creating..." : "Create Invoice & Copy Link"}
        </Button>
      </CardContent>
    </Card>
  );
}
