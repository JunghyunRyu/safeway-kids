import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VehicleClearance } from '../screens/driver/components/VehicleClearance';

const clearanceItems = [
  { key: 'seatbelt', label: '안전벨트 확인' },
  { key: 'headcount', label: '인원 확인' },
];

const baseProps = {
  visible: false,
  vehicleId: 'v-1',
  clearanceItems,
  clearanceChecks: {} as Record<string, boolean>,
  setClearanceChecks: jest.fn(),
  onShow: jest.fn(),
  onHide: jest.fn(),
  onSubmit: jest.fn(),
};

describe('VehicleClearance', () => {
  it('renders without crashing', () => {
    render(<VehicleClearance {...baseProps} />);
  });

  it('shows start button when not visible', () => {
    render(<VehicleClearance {...baseProps} />);
    expect(screen.getByText('잔류 확인 시작')).toBeTruthy();
  });

  it('shows checklist when visible', () => {
    render(<VehicleClearance {...baseProps} visible={true} />);
    expect(screen.getByText('안전벨트 확인')).toBeTruthy();
    expect(screen.getByText('인원 확인')).toBeTruthy();
  });

  it('shows submit and cancel buttons when visible', () => {
    render(<VehicleClearance {...baseProps} visible={true} />);
    expect(screen.getByText('점검 완료 제출')).toBeTruthy();
    expect(screen.getByText('취소')).toBeTruthy();
  });
});
