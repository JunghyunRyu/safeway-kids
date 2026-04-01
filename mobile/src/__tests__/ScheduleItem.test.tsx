import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ScheduleItem, { ScheduleItemProps } from '../screens/parent/components/ScheduleItem';

const baseProps: ScheduleItemProps = {
  id: 'sched-1',
  studentName: '이서연',
  pickupTime: '14:30:00',
  status: 'scheduled',
  boardedAt: null,
  alightedAt: null,
  academyName: '한빛학원',
  vehiclePlate: '12가 3456',
  driverName: '김기사',
  onCancel: jest.fn(),
};

describe('ScheduleItem', () => {
  it('renders without crashing', () => {
    render(<ScheduleItem {...baseProps} />);
  });

  it('displays the student name', () => {
    render(<ScheduleItem {...baseProps} />);
    expect(screen.getByText('이서연')).toBeTruthy();
  });

  it('displays the academy name', () => {
    render(<ScheduleItem {...baseProps} />);
    expect(screen.getByText('한빛학원')).toBeTruthy();
  });

  it('shows cancel button for scheduled status', () => {
    render(<ScheduleItem {...baseProps} />);
    expect(screen.getByText('schedule.cancelRide')).toBeTruthy();
  });

  it('renders compact mode', () => {
    render(<ScheduleItem {...baseProps} compact />);
    expect(screen.getByText('이서연')).toBeTruthy();
  });
});
