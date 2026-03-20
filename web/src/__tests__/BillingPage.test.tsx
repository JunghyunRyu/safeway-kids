import { render, screen, waitFor } from '@testing-library/react';
import BillingPage from '../pages/BillingPage';
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

describe('BillingPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<BillingPage />);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('renders billing page with sections when academy exists', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes('/academies/mine')) {
        return Promise.resolve({
          data: { id: 'acad-1', name: '테스트 학원', address: '서울시' },
        });
      }
      if (url.includes('/billing/plans')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/billing/invoices')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: null });
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('청구 관리')).toBeInTheDocument();
    });

    expect(screen.getByText('요금제')).toBeInTheDocument();
    expect(screen.getByText('청구서 생성')).toBeInTheDocument();
    expect(screen.getByText('청구서 목록')).toBeInTheDocument();
    expect(screen.getByText('+ 요금제 추가')).toBeInTheDocument();
    expect(screen.getByText('청구서 일괄 생성')).toBeInTheDocument();
  });

  it('shows no-academy message when academy is null', async () => {
    mockApi.get.mockImplementation(() => {
      return Promise.resolve({ data: null });
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(
        screen.getByText('등록된 학원이 없습니다. 먼저 학원을 등록해 주세요.'),
      ).toBeInTheDocument();
    });
  });
});
