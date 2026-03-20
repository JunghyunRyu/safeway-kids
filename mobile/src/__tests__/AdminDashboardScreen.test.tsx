import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';

describe('AdminDashboardScreen', () => {
  it('renders without crashing', () => {
    render(<AdminDashboardScreen />);
  });

  it('shows dashboard title', () => {
    render(<AdminDashboardScreen />);
    expect(screen.getByText('관리자 대시보드')).toBeTruthy();
  });

  it('shows admin role badge', () => {
    render(<AdminDashboardScreen />);
    // Multiple elements contain "관리자", so check at least two exist
    expect(screen.getAllByText(/관리자/).length).toBeGreaterThanOrEqual(2);
  });
});
