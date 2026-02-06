// Invoice types and local storage management

export interface Invoice {
  id: string;
  createdAt: number;
  createdBy: string; // wallet address
  recipientAddress: string;
  recipientChainId: number;
  amount: string;
  description: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  paidAt?: number;
  paidBy?: string;
  txHash?: string;
  sourceChainId?: number;
}

const STORAGE_KEY = "warpsend_invoices";

// Generate a unique invoice ID
export function generateInvoiceId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get all invoices from localStorage
export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Get invoices created by a specific address
export function getInvoicesByCreator(address: string): Invoice[] {
  const invoices = getInvoices();
  return invoices.filter(
    (inv) => inv.createdBy.toLowerCase() === address.toLowerCase()
  );
}

// Get a single invoice by ID
export function getInvoiceById(id: string): Invoice | null {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

// Create a new invoice
export function createInvoice(
  invoice: Omit<Invoice, "id" | "createdAt" | "status">
): Invoice {
  const newInvoice: Invoice = {
    ...invoice,
    id: generateInvoiceId(),
    createdAt: Date.now(),
    status: "pending",
  };

  const invoices = getInvoices();
  invoices.push(newInvoice);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));

  return newInvoice;
}

// Update invoice status
export function updateInvoice(
  id: string,
  updates: Partial<Invoice>
): Invoice | null {
  const invoices = getInvoices();
  const index = invoices.findIndex((inv) => inv.id === id);
  
  if (index === -1) return null;

  invoices[index] = { ...invoices[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));

  return invoices[index];
}

// Mark invoice as paid
export function markInvoicePaid(
  id: string,
  paidBy: string,
  txHash: string,
  sourceChainId: number
): Invoice | null {
  return updateInvoice(id, {
    status: "paid",
    paidAt: Date.now(),
    paidBy,
    txHash,
    sourceChainId,
  });
}

// Cancel an invoice
export function cancelInvoice(id: string): Invoice | null {
  return updateInvoice(id, { status: "cancelled" });
}

// Delete an invoice
export function deleteInvoice(id: string): boolean {
  const invoices = getInvoices();
  const filtered = invoices.filter((inv) => inv.id !== id);
  
  if (filtered.length === invoices.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Generate payment link
export function getPaymentLink(invoiceId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/pay/${invoiceId}`;
}

// Format invoice for display
export function formatInvoiceStatus(status: Invoice["status"]): string {
  const statusMap: Record<Invoice["status"], string> = {
    pending: "Pending",
    paid: "Paid",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return statusMap[status];
}
