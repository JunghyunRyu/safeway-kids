import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import InvoiceCard from '../screens/parent/components/InvoiceCard';
import { Invoice } from '../api/billing';

const mockInvoice: Invoice = {
  id: 'inv-1',
  parent_id: 'p-1',
  academy_id: 'a-1',
  student_id: 's-1',
  billing_month: '2026-03',
  total_rides: 20,
  amount: 150000,
  status: 'pending',
  due_date: '2026-03-31',
  paid_at: null,
  academy_name: '한빛학원',
  student_name: '김민준',
};

describe('InvoiceCard', () => {
  it('renders without crashing', () => {
    render(<InvoiceCard invoice={mockInvoice} />);
  });

  it('displays the billing month', () => {
    render(<InvoiceCard invoice={mockInvoice} />);
    expect(screen.getByText('2026-03')).toBeTruthy();
  });

  it('displays status label', () => {
    render(<InvoiceCard invoice={mockInvoice} />);
    expect(screen.getByText('미납')).toBeTruthy();
  });

  it('shows student and academy info', () => {
    render(<InvoiceCard invoice={mockInvoice} />);
    expect(screen.getByText('김민준 · 한빛학원')).toBeTruthy();
  });
});
