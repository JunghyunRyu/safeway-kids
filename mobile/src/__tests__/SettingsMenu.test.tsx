import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SettingsMenu from '../screens/parent/components/SettingsMenu';

const baseProps = {
  userRole: 'parent',
  withdrawingConsent: false,
  onShowChildProfile: jest.fn(),
  onShowNotifSettings: jest.fn(),
  onShowSupportModal: jest.fn(),
  onShowTickets: jest.fn(),
  onWithdrawConsent: jest.fn(),
};

describe('SettingsMenu', () => {
  it('renders without crashing', () => {
    render(<SettingsMenu {...baseProps} />);
  });

  it('shows settings title', () => {
    render(<SettingsMenu {...baseProps} />);
    expect(screen.getByText('설정')).toBeTruthy();
  });

  it('shows child management for parent role', () => {
    render(<SettingsMenu {...baseProps} />);
    expect(screen.getByText('자녀 관리')).toBeTruthy();
  });

  it('shows notification settings', () => {
    render(<SettingsMenu {...baseProps} />);
    expect(screen.getByText('알림 설정')).toBeTruthy();
  });

  it('shows support menu items', () => {
    render(<SettingsMenu {...baseProps} />);
    expect(screen.getByText('문의하기')).toBeTruthy();
    expect(screen.getByText('내 문의 내역')).toBeTruthy();
  });

  it('shows consent withdrawal option', () => {
    render(<SettingsMenu {...baseProps} />);
    expect(screen.getByText('개인정보 동의 철회')).toBeTruthy();
  });

  it('hides child management for non-parent role', () => {
    render(<SettingsMenu {...baseProps} userRole="student" />);
    expect(screen.queryByText('자녀 관리')).toBeNull();
  });
});
