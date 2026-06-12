/**
 * PT 결제 API (FR-MP1) — 백엔드 /pt/payments/* 매핑.
 * 실 PG 채널 연결 전에는 백엔드 dev-mock이 confirm을 PAID로 처리한다.
 */

import apiClient from '@safeway/core-mobile/api/client';

export interface PaymentPrepare {
  payment_id: string;
  merchant_uid: string;
  amount: number;
  currency: string;
  pg_provider: string;
}

export interface PaymentConfirm {
  payment_id: string;
  status: string;
  amount: number;
  paid_at: string | null;
  imp_uid: string | null;
}

export interface PaymentItem {
  payment_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: string; // pending | paid | cancelled | refunded
  merchant_uid: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancel_amount: number | null;
  cancel_reason: string | null;
  created_at: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  pet_name: string | null;
}

export interface PaymentList {
  items: PaymentItem[];
  total: number;
}

export async function preparePayment(bookingId: string): Promise<PaymentPrepare> {
  const resp = await apiClient.post('/pt/payments/prepare', { booking_id: bookingId });
  return resp.data;
}

export async function confirmPayment(
  impUid: string,
  merchantUid: string,
): Promise<PaymentConfirm> {
  const resp = await apiClient.post('/pt/payments/confirm', {
    imp_uid: impUid,
    merchant_uid: merchantUid,
  });
  return resp.data;
}

export async function cancelPayment(
  paymentId: string,
  reason: string,
  cancelAmount?: number,
): Promise<void> {
  await apiClient.post(`/pt/payments/${paymentId}/cancel`, {
    reason,
    ...(cancelAmount ? { cancel_amount: cancelAmount } : {}),
  });
}

export async function listPayments(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaymentList> {
  const resp = await apiClient.get('/pt/payments', { params });
  return resp.data;
}
