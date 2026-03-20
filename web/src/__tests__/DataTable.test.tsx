import { render, screen } from '@testing-library/react';
import DataTable, { type Column } from '../components/DataTable';

interface Row {
  id: string;
  name: string;
  age: number;
}

const columns: Column<Row>[] = [
  { key: 'name', label: '이름' },
  { key: 'age', label: '나이' },
];

const sampleData: Row[] = [
  { id: '1', name: '김철수', age: 10 },
  { id: '2', name: '이영희', age: 11 },
  { id: '3', name: '박민수', age: 9 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={sampleData} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('나이')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={sampleData} />);

    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
    expect(screen.getByText('박민수')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="결과 없음" />);

    expect(screen.getByText('결과 없음')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<DataTable columns={columns} data={[]} loading={true} />);

    expect(screen.getByRole('status', { name: '데이터 로딩 중' })).toBeInTheDocument();
  });

  it('pagination controls appear when data exceeds pageSize', () => {
    // Create 5 rows, pageSize=2 => 3 pages
    const manyRows: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      name: `학생${i}`,
      age: 10 + i,
    }));

    render(<DataTable columns={columns} data={manyRows} pageSize={2} />);

    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeInTheDocument();
  });

  it('does not show pagination when data fits in one page', () => {
    render(<DataTable columns={columns} data={sampleData} pageSize={10} />);

    expect(screen.queryByRole('button', { name: '이전 페이지' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다음 페이지' })).not.toBeInTheDocument();
  });
});
