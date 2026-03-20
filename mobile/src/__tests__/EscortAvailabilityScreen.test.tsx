import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AvailabilityScreen from '../screens/escort/AvailabilityScreen';

describe('EscortAvailabilityScreen', () => {
  it('renders without crashing', () => {
    render(<AvailabilityScreen />);
  });

  it('shows page title', () => {
    render(<AvailabilityScreen />);
    expect(screen.getByText('가용시간')).toBeTruthy();
  });

  it('shows register button', () => {
    render(<AvailabilityScreen />);
    expect(screen.getByText('등록')).toBeTruthy();
  });

  it('shows empty state when no availability', async () => {
    render(<AvailabilityScreen />);
    const emptyText = await screen.findByText('등록된 가용시간이 없습니다');
    expect(emptyText).toBeTruthy();
  });
});
