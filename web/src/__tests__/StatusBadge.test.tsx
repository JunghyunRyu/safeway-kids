import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders with correct label for known statuses', () => {
    const { rerender } = render(<StatusBadge status="active" />);
    expect(screen.getByText('활성')).toBeInTheDocument();

    rerender(<StatusBadge status="pending" />);
    expect(screen.getByText('대기중')).toBeInTheDocument();

    rerender(<StatusBadge status="paid" />);
    expect(screen.getByText('결제완료')).toBeInTheDocument();

    rerender(<StatusBadge status="overdue" />);
    expect(screen.getByText('연체')).toBeInTheDocument();

    rerender(<StatusBadge status="cancelled" />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('uses correct color for each status', () => {
    const { rerender } = render(<StatusBadge status="active" />);
    expect(screen.getByText('활성').className).toContain('bg-green-100');
    expect(screen.getByText('활성').className).toContain('text-green-700');

    rerender(<StatusBadge status="overdue" />);
    expect(screen.getByText('연체').className).toContain('bg-red-100');
    expect(screen.getByText('연체').className).toContain('text-red-700');

    rerender(<StatusBadge status="pending" />);
    expect(screen.getByText('대기중').className).toContain('bg-yellow-100');
    expect(screen.getByText('대기중').className).toContain('text-yellow-700');
  });

  it('falls back to raw status text for unknown statuses', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });

  it('uses fallback gray color for unknown statuses', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status').className).toContain('bg-gray-100');
  });
});
