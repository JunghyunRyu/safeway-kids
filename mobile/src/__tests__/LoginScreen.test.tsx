import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

// Override useAuth mock for LoginScreen — user is not logged in
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    authenticated: false,
    loading: false,
    onLoginSuccess: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    render(<LoginScreen />);
  });

  it('shows the app title', () => {
    render(<LoginScreen />);
    expect(screen.getByText('SAFEWAY KIDS')).toBeTruthy();
  });

  it('shows dev mode subtitle', () => {
    render(<LoginScreen />);
    expect(screen.getByText('개발 모드 로그인')).toBeTruthy();
  });

  it('renders role selector buttons', () => {
    render(<LoginScreen />);
    expect(screen.getByText('학부모')).toBeTruthy();
    expect(screen.getByText('기사')).toBeTruthy();
    expect(screen.getByText('안전도우미')).toBeTruthy();
    expect(screen.getByText('관리자')).toBeTruthy();
  });

  it('renders phone and name input placeholders', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText('auth.enterPhone')).toBeTruthy();
    expect(screen.getByPlaceholderText('auth.enterName')).toBeTruthy();
  });

  it('renders login button', () => {
    render(<LoginScreen />);
    expect(screen.getByText('auth.login')).toBeTruthy();
  });
});
