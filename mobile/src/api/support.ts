import apiClient from "./client";

export interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
}

export async function createSupportTicket(data: {
  category: string;
  subject: string;
  description: string;
}): Promise<SupportTicket> {
  const resp = await apiClient.post("/support/tickets", data);
  return resp.data;
}

export async function getMyTickets(): Promise<SupportTicket[]> {
  const resp = await apiClient.get("/support/tickets");
  return resp.data;
}
