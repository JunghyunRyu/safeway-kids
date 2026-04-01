import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MemoModal } from '../screens/driver/components/MemoModal';

const baseProps = {
  visible: true,
  text: '',
  saving: false,
  onChangeText: jest.fn(),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('MemoModal', () => {
  it('renders without crashing', () => {
    render(<MemoModal {...baseProps} />);
  });

  it('shows the title', () => {
    render(<MemoModal {...baseProps} />);
    expect(screen.getByText('특이사항 메모')).toBeTruthy();
  });

  it('shows the text input', () => {
    render(<MemoModal {...baseProps} />);
    expect(screen.getByLabelText('특이사항 메모 입력')).toBeTruthy();
  });

  it('shows save button', () => {
    render(<MemoModal {...baseProps} />);
    expect(screen.getByText('저장')).toBeTruthy();
  });

  it('shows saving state', () => {
    render(<MemoModal {...baseProps} saving={true} />);
    expect(screen.getByText('저장 중...')).toBeTruthy();
  });
});
