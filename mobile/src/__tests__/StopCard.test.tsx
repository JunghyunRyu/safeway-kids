import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StopCard, StopCardProps } from '../screens/driver/components/StopCard';

const baseProps: StopCardProps = {
  id: 'stop-1',
  index: 0,
  studentName: '김민준',
  studentPhotoUrl: null,
  academyName: '한빛학원',
  pickupTime: '08:30:00',
  pickupAddress: '서울시 강남구 역삼동 123',
  pickupLatitude: 37.5,
  pickupLongitude: 127.0,
  specialNotes: null,
  allergies: null,
  guardianPhoneMasked: null,
  status: 'scheduled',
  isBoarded: false,
  isCompleted: false,
  isCancelled: false,
  isNoShow: false,
  isNextStop: false,
  boardedAt: null,
  alightedAt: null,
  arrivalConfirmedAt: null,
  notificationSent: null,
  onBoard: jest.fn(),
  onAlight: jest.fn(),
  onNoShow: jest.fn(),
  onUndoBoard: jest.fn(),
  onUndoAlight: jest.fn(),
  onArrivalConfirm: jest.fn(),
  onMemo: jest.fn(),
};

// Mock navigation utility
jest.mock('../utils/navigation', () => ({
  openNavigation: jest.fn(),
}));

describe('StopCard', () => {
  it('renders without crashing', () => {
    render(<StopCard {...baseProps} />);
  });

  it('displays the student name', () => {
    render(<StopCard {...baseProps} />);
    expect(screen.getByText('김민준')).toBeTruthy();
  });

  it('displays the academy name', () => {
    render(<StopCard {...baseProps} />);
    expect(screen.getByText('한빛학원')).toBeTruthy();
  });

  it('shows special notes when provided', () => {
    render(<StopCard {...baseProps} specialNotes="차멀미 주의" />);
    expect(screen.getByText('차멀미 주의')).toBeTruthy();
  });

  it('shows board button when not boarded', () => {
    render(<StopCard {...baseProps} />);
    expect(screen.getByText('driver.markBoarded')).toBeTruthy();
  });
});
