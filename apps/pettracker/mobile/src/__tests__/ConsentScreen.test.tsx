// FR-M2 ConsentScreen — 필수 동의 게이트 UI.

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConsentScreen from '../screens/shared/ConsentScreen';

describe('ConsentScreen', () => {
  it('필수 미체크 상태에서는 진행 버튼이 비활성', () => {
    const onAgree = jest.fn();
    const { getByLabelText } = render(
      <ConsentScreen role="pet_owner" onAgree={onAgree} onBack={jest.fn()} />,
    );
    fireEvent.press(getByLabelText('동의하고 계속'));
    expect(onAgree).not.toHaveBeenCalled();
  });

  it('전체 동의 후 진행하면 모든 doc_type이 전달된다', () => {
    const onAgree = jest.fn();
    const { getByText, getByLabelText } = render(
      <ConsentScreen role="walker" onAgree={onAgree} onBack={jest.fn()} />,
    );
    fireEvent.press(getByText('전체 동의'));
    fireEvent.press(getByLabelText('동의하고 계속'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    const docs: string[] = onAgree.mock.calls[0][0];
    expect(docs.sort()).toEqual(['age14', 'location', 'marketing', 'privacy', 'terms']);
  });

  it('필수만 개별 체크해도 진행 가능 (선택 제외)', () => {
    const onAgree = jest.fn();
    const { getByText, getByLabelText } = render(
      <ConsentScreen role="pet_owner" onAgree={onAgree} onBack={jest.fn()} />,
    );
    fireEvent.press(getByText(/이용약관 동의/));
    fireEvent.press(getByText(/개인정보 수집·이용 동의/));
    fireEvent.press(getByText(/만 14세 이상입니다/));
    fireEvent.press(getByLabelText('동의하고 계속'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onAgree.mock.calls[0][0].sort()).toEqual(['age14', 'privacy', 'terms']);
  });
});
