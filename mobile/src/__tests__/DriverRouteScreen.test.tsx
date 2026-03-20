import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DriverRouteScreen from '../screens/driver/RouteScreen';

describe('DriverRouteScreen', () => {
  it('renders without crashing', () => {
    render(<DriverRouteScreen />);
  });

  it('shows page title', () => {
    render(<DriverRouteScreen />);
    expect(screen.getByText('driver.stopList')).toBeTruthy();
  });

  it('shows empty state when no schedules', () => {
    render(<DriverRouteScreen />);
    expect(screen.getByText('driver.noAssignment')).toBeTruthy();
  });
});
