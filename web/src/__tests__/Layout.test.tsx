import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import type { User } from '../types';

const mockUser: User = {
  id: 'user-1',
  phone: '01012345678',
  name: '테스트 관리자',
  role: 'academy_admin',
  is_active: true,
};

describe('Layout', () => {
  it('renders sidebar navigation with all menu items', () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <Layout user={mockUser} onLogout={onLogout} />
      </MemoryRouter>,
    );

    // SafeWay Kids appears in both sidebar and mobile header
    expect(screen.getAllByText('SafeWay Kids').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('학원 관리자 대시보드')).toBeInTheDocument();

    // Navigation items
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('학생 관리')).toBeInTheDocument();
    expect(screen.getByText('스케줄')).toBeInTheDocument();
    expect(screen.getByText('차량 관리')).toBeInTheDocument();
    expect(screen.getByText('청구 관리')).toBeInTheDocument();
  });

  it('displays user name and logout button', () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <Layout user={mockUser} onLogout={onLogout} />
      </MemoryRouter>,
    );

    expect(screen.getByText('테스트 관리자')).toBeInTheDocument();
    expect(screen.getByText('로그아웃')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const onLogout = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Layout user={mockUser} onLogout={onLogout} />
      </MemoryRouter>,
    );

    await user.click(screen.getByText('로그아웃'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
