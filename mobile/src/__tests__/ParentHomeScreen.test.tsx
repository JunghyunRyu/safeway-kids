import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ParentHomeScreen from '../screens/parent/HomeScreen';

describe('ParentHomeScreen', () => {
  it('renders without crashing', () => {
    render(<ParentHomeScreen />);
  });

  it('shows greeting with user name', () => {
    render(<ParentHomeScreen />);
    expect(screen.getByText(/home\.greeting.*박보호자/)).toBeTruthy();
  });

  it('shows today schedule section', () => {
    render(<ParentHomeScreen />);
    expect(screen.getByText('home.todaySchedule')).toBeTruthy();
  });

  it('shows empty state when no schedules', () => {
    render(<ParentHomeScreen />);
    expect(screen.getByText('home.noSchedule')).toBeTruthy();
  });
});
