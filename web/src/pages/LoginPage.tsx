import { useState } from 'react';
import api from '../api/client';
import type { TokenResponse } from '../types';

interface Props {
  onLogin: (user: TokenResponse['user'], accessToken: string, refreshToken: string) => void;
}

type OtpStep = 'phone' | 'verify';

const isValidPhone = (p: string) => /^01[0-9]{8,9}$/.test(p);

export default function LoginPage({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dev mode state
  const [phone, setPhone] = useState(import.meta.env.DEV ? '01099999999' : '');
  const [name, setName] = useState(import.meta.env.DEV ? '학원관리자' : '');

  // Production OTP state
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [role, setRole] = useState<'academy_admin' | 'platform_admin'>('academy_admin');

  // ── Dev login handlers ────────────────────────────────────────
  const handlePlatformLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<TokenResponse>('/auth/dev-login', {
        phone: '01000000000',
        name: '플랫폼관리자',
        role: 'platform_admin',
        code: '000000',
      });
      onLogin(data.user, data.access_token, data.refresh_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('올바른 전화번호 형식이 아닙니다 (예: 01012345678)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<TokenResponse>('/auth/dev-login', {
        phone,
        name,
        role: 'academy_admin',
        code: '000000',
      });
      onLogin(data.user, data.access_token, data.refresh_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  // ── Production OTP handlers ───────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('올바른 전화번호 형식이 아닙니다 (예: 01012345678)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/otp/send', { phone });
      setOtpStep('verify');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '인증번호 전송에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<TokenResponse>('/auth/otp/verify', {
        phone,
        code: otpCode,
        name,
        role,
      });
      onLogin(data.user, data.access_token, data.refresh_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || '인증에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ── DEV mode UI ───────────────────────────────────────────────
  if (import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleDevLogin}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">
            SafeWay Kids
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">학원 관리자 로그인</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">
            전화번호
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
            placeholder="01012345678"
            pattern="01[0-9]{8,9}"
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
            placeholder="홍길동"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '로그인 중...' : '학원 관리자 로그인'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handlePlatformLogin}
            className="w-full mt-3 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '로그인 중...' : '플랫폼 관리자 로그인'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            개발 모드: OTP 검증 없이 바로 로그인
          </p>
        </form>
      </div>
    );
  }

  // ── Production OTP UI ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">
          SafeWay Kids
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">관리자 로그인</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {otpStep === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              placeholder="01012345678"
              pattern="01[0-9]{8,9}"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '전송 중...' : '인증번호 전송'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              인증번호 (6자리)
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              placeholder="000000"
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              placeholder="홍길동"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'academy_admin' | 'platform_admin')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white"
            >
              <option value="academy_admin">학원 관리자</option>
              <option value="platform_admin">플랫폼 관리자</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '인증 중...' : '로그인'}
            </button>

            <button
              type="button"
              onClick={() => { setOtpStep('phone'); setError(''); }}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              전화번호 다시 입력
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
