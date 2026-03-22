import apiClient from "./client";

export interface Invoice {
  id: string;
  parent_id: string;
  academy_id: string;
  student_id: string;
  billing_month: string;
  total_rides: number;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  academy_name: string | null;
  student_name: string | null;
}

export async function getMyInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>("/billing/invoices/my");
  return data;
}

// Admin API
export async function getInvoicesByAcademy(academyId: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>(`/billing/invoices?academy_id=${academyId}`);
  return data;
}

export async function markInvoicePaid(invoiceId: string): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/billing/invoices/${invoiceId}/mark-paid`);
  return data;
}

export async function generateInvoices(billingMonth: string, academyId: string): Promise<void> {
  await apiClient.post("/billing/generate-invoices", {
    billing_month: billingMonth,
    academy_id: academyId,
  });
}

// Payment API
export interface PreparePaymentResponse {
  order_id: string;
  amount: number;
  order_name: string;
}

export async function preparePayment(invoiceId: number): Promise<PreparePaymentResponse> {
  const { data } = await apiClient.post<PreparePaymentResponse>(
    "/billing/payments/prepare",
    { invoice_id: invoiceId },
  );
  return data;
}

export interface ConfirmPaymentResponse {
  status: string;
  payment_id: string;
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<ConfirmPaymentResponse> {
  const { data } = await apiClient.post<ConfirmPaymentResponse>(
    "/billing/payments/confirm",
    { payment_key: paymentKey, order_id: orderId, amount },
  );
  return data;
}
