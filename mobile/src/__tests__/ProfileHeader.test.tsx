import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProfileHeader from '../screens/parent/components/ProfileHeader';

describe('ProfileHeader', () => {
  const mockUser = {
    name: '박보호자',
    phone: '01033333333',
    email: 'park@test.com',
    role: 'parent',
  };

  it('renders without crashing', () => {
    render(<ProfileHeader user={mockUser} />);
  });

  it('displays user name', () => {
    render(<ProfileHeader user={mockUser} />);
    expect(screen.getByText('박보호자')).toBeTruthy();
  });

  it('displays role label', () => {
    render(<ProfileHeader user={mockUser} />);
    expect(screen.getAllByText('학부모').length).toBeGreaterThanOrEqual(1);
  });

  it('displays user initials in avatar', () => {
    render(<ProfileHeader user={mockUser} />);
    expect(screen.getByText('박')).toBeTruthy();
  });

  it('renders safely with null user', () => {
    render(<ProfileHeader user={null} />);
    expect(screen.getByText('?')).toBeTruthy();
  });
});
