import { render, screen } from '@testing-library/react';
import KpiCard from '../components/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="총 학생 수" value={42} />);

    expect(screen.getByText('총 학생 수')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<KpiCard title="상태" value="정상" />);

    expect(screen.getByText('상태')).toBeInTheDocument();
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('shows subtitle when provided', () => {
    render(<KpiCard title="매출" value="1,000,000" subtitle="지난달 대비" />);

    expect(screen.getByText('지난달 대비')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<KpiCard title="매출" value="1,000,000" />);

    expect(screen.queryByText('지난달 대비')).not.toBeInTheDocument();
  });
});
