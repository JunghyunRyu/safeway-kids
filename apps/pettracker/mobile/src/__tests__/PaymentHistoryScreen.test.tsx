// FR-MP3 결제 내역 — pt_payments 실 데이터 기반 렌더링.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PaymentHistoryScreen from '../screens/owner/PaymentHistoryScreen';
import { listPayments } from '../api/payments';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

const PAID = {
  payment_id: 'pay-1', booking_id: 'b-1', amount: 25000, currency: 'KRW',
  status: 'paid', merchant_uid: 'pt_a1_1', paid_at: '2026-06-11T10:00:00Z',
  cancelled_at: null, cancel_amount: null, cancel_reason: null,
  created_at: '2026-06-11T09:59:00Z', scheduled_at: '2026-06-12T10:00:00Z',
  duration_minutes: 30, pet_name: '콩이',
};

const CANCELLED = {
  ...PAID, payment_id: 'pay-2', booking_id: 'b-2', status: 'cancelled',
  merchant_uid: 'pt_a2_1', cancel_amount: 25000, cancel_reason: '보호자 요청',
  cancelled_at: '2026-06-11T11:00:00Z',
};

describe('PaymentHistoryScreen', () => {
  it('pt_payments 데이터로 내역과 합계(paid만)를 렌더링한다', async () => {
    (listPayments as jest.Mock).mockResolvedValue({ items: [PAID, CANCELLED], total: 2 });
    const { getByText, getAllByText } = render(<PaymentHistoryScreen navigation={navigation} />);
    await waitFor(() => {
      expect(getByText('결제 완료')).toBeTruthy();
      expect(getByText('취소')).toBeTruthy();
      // 합계는 paid 1건만 (취소 건 제외)
      expect(getAllByText('25,000원').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText(/콩이 · 30분 산책/)).toHaveLength(2);
    });
  });

  it('빈 내역이면 빈 상태 문구를 보여준다', async () => {
    (listPayments as jest.Mock).mockResolvedValue({ items: [], total: 0 });
    const { getByText } = render(<PaymentHistoryScreen navigation={navigation} />);
    await waitFor(() => {
      expect(getByText('아직 결제 내역이 없어요')).toBeTruthy();
    });
  });
});
