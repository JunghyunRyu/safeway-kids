import { render, screen } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  it('renders the login form with phone and name inputs', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    expect(screen.getByText('SafeWay Kids')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('01012345678')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '학원 관리자 로그인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '플랫폼 관리자 로그인' })).toBeInTheDocument();
  });

  it('has default values in phone and name fields', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    expect(screen.getByPlaceholderText('01012345678')).toHaveValue('01099999999');
    expect(screen.getByPlaceholderText('홍길동')).toHaveValue('학원관리자');
  });

  it('shows dev mode notice', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    expect(screen.getByText('개발 모드: OTP 검증 없이 바로 로그인')).toBeInTheDocument();
  });
});
