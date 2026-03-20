import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ShiftsScreen from '../screens/escort/ShiftsScreen';

describe('EscortShiftsScreen', () => {
  it('renders without crashing', () => {
    render(<ShiftsScreen />);
  });

  it('shows page title', () => {
    render(<ShiftsScreen />);
    expect(screen.getByText('내 근무')).toBeTruthy();
  });

  it('shows shift count badge', () => {
    render(<ShiftsScreen />);
    expect(screen.getByText(/\d+건/)).toBeTruthy();
  });

  it('shows empty state when no shifts', async () => {
    render(<ShiftsScreen />);
    const emptyText = await screen.findByText('배정된 근무가 없습니다');
    expect(emptyText).toBeTruthy();
  });
});
