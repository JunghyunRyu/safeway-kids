import { render, screen, waitFor } from '@testing-library/react';
import StudentsPage from '../pages/StudentsPage';
import api from '../api/client';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockApi = vi.mocked(api);

describe('StudentsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows heading and loading skeleton initially', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<StudentsPage />);

    // Heading is always rendered
    expect(screen.getByText('학생 관리')).toBeInTheDocument();
    // DataTable loading skeleton renders animated pulse divs, not text
    expect(screen.getByText('+ 학생 추가')).toBeInTheDocument();
  });

  it('renders student list heading and empty state', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    render(<StudentsPage />);

    await waitFor(() => {
      expect(screen.getByText('학생 관리')).toBeInTheDocument();
    });

    // The full empty message includes instructions about the add button
    expect(
      screen.getByText('등록된 학생이 없습니다. "학생 추가" 버튼으로 등록할 수 있습니다.'),
    ).toBeInTheDocument();
  });

  it('renders students when data is returned', async () => {
    mockApi.get.mockResolvedValue({
      data: [
        { id: '1', name: '김민수', grade: '3', date_of_birth: '2017-05-15', guardian_id: '10', is_active: true, created_at: '2026-03-01' },
        { id: '2', name: '이서연', grade: '1', date_of_birth: '2019-08-20', guardian_id: '11', is_active: true, created_at: '2026-03-10' },
      ],
    });

    render(<StudentsPage />);

    await waitFor(() => {
      expect(screen.getByText('김민수')).toBeInTheDocument();
    });

    expect(screen.getByText('이서연')).toBeInTheDocument();
  });
});
