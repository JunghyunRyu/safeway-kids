import React from 'react';
import { render, screen } from '@testing-library/react-native';
import BillingScreen from '../screens/parent/BillingScreen';

describe('ParentBillingScreen', () => {
  it('renders without crashing', () => {
    render(<BillingScreen />);
  });

  it('shows page title', () => {
    render(<BillingScreen />);
    expect(screen.getByText('청구서')).toBeTruthy();
  });

  it('shows total count badge', () => {
    render(<BillingScreen />);
    expect(screen.getByText(/총 \d+건/)).toBeTruthy();
  });

  it('shows empty state when no invoices', async () => {
    render(<BillingScreen />);
    const emptyText = await screen.findByText('청구서가 없습니다');
    expect(emptyText).toBeTruthy();
  });
});
