import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
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

describe('DashboardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    // Never resolving promises to keep loading state
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('renders dashboard with academy data', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/academies/mine')) {
        return Promise.resolve({
          data: { id: 'acad-1234-5678', name: '테스트 학원', address: '서울시 강남구' },
        });
      }
      if (url.includes('/vehicles')) {
        return Promise.resolve({ data: [{ id: 'v1' }, { id: 'v2' }] });
      }
      if (url.includes('/schedules')) {
        return Promise.resolve({
          data: [
            {
              id: 's1',
              student_id: 'student-1234-5678-abcd',
              pickup_time: '08:30',
              status: 'scheduled',
            },
          ],
        });
      }
      if (url.includes('/students')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/billing/invoices')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('대시보드')).toBeInTheDocument();
    });

    expect(screen.getByText('테스트 학원')).toBeInTheDocument();
    expect(screen.getByText('서울시 강남구')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // vehicles count
    expect(screen.getByText('1')).toBeInTheDocument(); // schedules count
  });

  it('shows no-academy message when academy is null', async () => {
    mockApi.get.mockImplementation(() => {
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('등록된 학원이 없습니다. 먼저 학원을 등록해 주세요.'),
      ).toBeInTheDocument();
    });
  });
});
