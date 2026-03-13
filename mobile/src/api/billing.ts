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
}

export async function getMyInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>("/billing/invoices/my");
  return data;
}
