import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// We need to unmock useAuth for this test so we test the real hook
jest.unmock('../hooks/useAuth');

// Keep the API mocks, but customize isLoggedIn for this test
const mockIsLoggedIn = jest.fn().mockResolvedValue(false);
const mockGetMe = jest.fn().mockResolvedValue({
  id: 'user-1',
  role: 'parent',
  phone: '01033333333',
  name: '박보호자',
});

jest.mock('../api/auth', () => ({
  devLogin: jest.fn(),
  getMe: (...args: any[]) => mockGetMe(...args),
  isLoggedIn: (...args: any[]) => mockIsLoggedIn(...args),
  logout: jest.fn().mockResolvedValue(undefined),
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
}));

import { AuthProvider, useAuth } from '../hooks/useAuth';

describe('useAuth hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('returns the expected shape', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for loading to finish
    await act(async () => {
      // Allow the useEffect in AuthProvider to resolve
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('authenticated');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('onLoginSuccess');
    expect(result.current).toHaveProperty('signOut');
  });

  it('starts unauthenticated when not logged in', async () => {
    mockIsLoggedIn.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.authenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('onLoginSuccess and signOut are functions', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(typeof result.current.onLoginSuccess).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
