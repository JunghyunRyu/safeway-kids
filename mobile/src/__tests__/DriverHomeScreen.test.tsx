import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DriverHomeScreen from '../screens/driver/HomeScreen';

describe('DriverHomeScreen', () => {
  it('renders without crashing', () => {
    render(<DriverHomeScreen />);
  });

  it('shows greeting with user name', () => {
    render(<DriverHomeScreen />);
    expect(screen.getByText(/home\.greeting.*박보호자/)).toBeTruthy();
  });

  it('shows today summary section title', () => {
    render(<DriverHomeScreen />);
    expect(screen.getByText('driver.todaySummary')).toBeTruthy();
  });

  it('shows no assignment message when no vehicle assigned', () => {
    render(<DriverHomeScreen />);
    expect(screen.getByText('driver.noAssignment')).toBeTruthy();
  });
});
