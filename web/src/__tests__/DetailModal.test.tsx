import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DetailModal from '../components/DetailModal';

describe('DetailModal', () => {
  const fields = [
    { label: '이름', value: '김철수' },
    { label: '나이', value: '10세' },
    { label: '학교', value: '서울초등학교' },
  ];

  const baseProps = {
    open: true,
    title: '학생 상세',
    onClose: vi.fn(),
    fields,
  };

  it('renders field labels and values', () => {
    render(<DetailModal {...baseProps} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('나이')).toBeInTheDocument();
    expect(screen.getByText('10세')).toBeInTheDocument();
    expect(screen.getByText('학교')).toBeInTheDocument();
    expect(screen.getByText('서울초등학교')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<DetailModal {...baseProps} />);

    expect(screen.getByText('학생 상세')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<DetailModal {...baseProps} open={false} />);

    expect(screen.queryByText('학생 상세')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<DetailModal {...baseProps} onClose={onClose} />);

    // The X button has aria-label="닫기", the text button also says "닫기"
    const closeButtons = screen.getAllByRole('button', { name: '닫기' });
    await userEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when footer 닫기 button clicked', async () => {
    const onClose = vi.fn();
    render(<DetailModal {...baseProps} onClose={onClose} />);

    // There are two buttons matching "닫기" (X aria-label + footer text).
    // Use getAllByRole and pick the last one (footer).
    const closeButtons = screen.getAllByRole('button', { name: '닫기' });
    const footerClose = closeButtons[closeButtons.length - 1];
    await userEvent.click(footerClose);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows action buttons when provided', () => {
    render(
      <DetailModal
        {...baseProps}
        actions={<button type="button">수정</button>}
      />
    );

    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
  });
});
