/**
 * useWebSocket — Tech Spec FR-4.x · Todo Plan C-13
 * (artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md)
 *
 * 인증된 WebSocket 연결 + 지수 백오프 재연결 + first-message 토큰 협상.
 * PT/CC 공용. Backend C-11 `negotiate_ws_auth`의 first-message 패턴과 짝.
 *
 * 흐름:
 *   1. tokenStorage에서 access_token 로드
 *   2. WebSocket 연결 (wss:// or ws://, API_BASE_URL host 기반)
 *   3. open → {"token": "<jwt>"} 송신
 *   4. {"type":"auth_ok"} 수신 → status='open'
 *   5. 이후 메시지는 onMessage 콜백 + lastMessage state로 전달
 *   6. close 시 maxReconnectAttempts까지 지수 백오프(1s, 2s, 4s, 8s, 16s, cap 30s)
 *   7. 재연결 한도 초과 → status='failed' (호출 측이 HTTP polling fallback 결정)
 *
 * 설계 메모:
 * - 서버 ping("type":"ping")은 keep-alive 신호. 클라이언트는 무시(RN/브라우저가 protocol-level pong 자동).
 * - close code 4001(unauthorized) → 토큰 만료 가능성. 재연결 1회 시 refreshAccessToken 시도.
 * - close code 4003(forbidden) / 4404(not found) → 재연결 중단(영구 실패).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenStorage, API_BASE_URL, refreshAccessToken } from '../api/client';

export type WebSocketStatus =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'open'
  | 'closed'
  | 'failed';

export interface UseWebSocketOptions {
  path: string;
  enabled?: boolean;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (err: Error) => void;
  maxReconnectAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: unknown | null;
  reconnectAttempt: number;
  send: (data: unknown) => boolean;
  close: () => void;
}

const PERMANENT_CLOSE_CODES = new Set<number>([4003, 4404]);

function buildWsUrl(apiBaseUrl: string, path: string): string {
  const base = apiBaseUrl.replace(/^http/, 'ws').replace(/\/?$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    path,
    enabled = true,
    onMessage,
    onOpen,
    onClose,
    onError,
    maxReconnectAttempts = 5,
    initialBackoffMs = 1000,
    maxBackoffMs = 30000,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('idle');
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByCallerRef = useRef(false);
  const attemptRef = useRef(0);
  const refreshTriedRef = useRef(false);

  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    closedByCallerRef.current = true;
    cleanup();
    setStatus('closed');
  }, [cleanup]);

  const send = useCallback((data: unknown): boolean => {
    const sock = socketRef.current;
    if (!sock || sock.readyState !== 1) return false;
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    sock.send(payload);
    return true;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (closedByCallerRef.current) return;
    const attempt = attemptRef.current + 1;
    if (attempt > maxReconnectAttempts) {
      setStatus('failed');
      return;
    }
    attemptRef.current = attempt;
    setReconnectAttempt(attempt);
    const backoff = Math.min(
      initialBackoffMs * 2 ** (attempt - 1),
      maxBackoffMs,
    );
    reconnectTimerRef.current = setTimeout(() => {
      void connect();
    }, backoff);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxReconnectAttempts, initialBackoffMs, maxBackoffMs]);

  const connect = useCallback(async (): Promise<void> => {
    if (closedByCallerRef.current) return;
    setStatus('connecting');

    let token = await tokenStorage.getItem('access_token');
    if (!token && refreshTriedRef.current === false) {
      refreshTriedRef.current = true;
      token = await refreshAccessToken();
    }
    if (!token) {
      setStatus('failed');
      onErrorRef.current?.(new Error('No access token available for WebSocket'));
      return;
    }

    const url = buildWsUrl(API_BASE_URL, path);
    let sock: WebSocket;
    try {
      sock = new WebSocket(url);
    } catch (e) {
      onErrorRef.current?.(e instanceof Error ? e : new Error(String(e)));
      scheduleReconnect();
      return;
    }
    socketRef.current = sock;

    sock.onopen = () => {
      setStatus('authenticating');
      try {
        sock.send(JSON.stringify({ token }));
      } catch (e) {
        onErrorRef.current?.(e instanceof Error ? e : new Error(String(e)));
      }
    };

    sock.onmessage = (event: MessageEvent) => {
      let parsed: unknown = event.data;
      if (typeof event.data === 'string') {
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = event.data;
        }
      }

      const obj = parsed as { type?: string } | null;
      if (obj && typeof obj === 'object' && obj.type === 'auth_ok') {
        attemptRef.current = 0;
        setReconnectAttempt(0);
        refreshTriedRef.current = false;
        setStatus('open');
        onOpenRef.current?.();
        return;
      }
      if (obj && typeof obj === 'object' && obj.type === 'ping') {
        return;
      }

      setLastMessage(parsed);
      onMessageRef.current?.(parsed);
    };

    sock.onerror = (event: Event) => {
      const err = (event as unknown as { message?: string })?.message
        ? new Error((event as unknown as { message: string }).message)
        : new Error('WebSocket error');
      onErrorRef.current?.(err);
    };

    sock.onclose = (event: CloseEvent) => {
      const code = event.code ?? 1006;
      const reason = event.reason ?? '';
      onCloseRef.current?.(code, reason);

      if (closedByCallerRef.current) {
        setStatus('closed');
        return;
      }

      if (PERMANENT_CLOSE_CODES.has(code)) {
        setStatus('failed');
        return;
      }

      if (code === 4001 && refreshTriedRef.current === false) {
        refreshTriedRef.current = true;
        void refreshAccessToken().then(() => scheduleReconnect());
        return;
      }

      scheduleReconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, scheduleReconnect]);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      setStatus('idle');
      return;
    }
    closedByCallerRef.current = false;
    attemptRef.current = 0;
    setReconnectAttempt(0);
    refreshTriedRef.current = false;
    void connect();
    return () => {
      closedByCallerRef.current = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, path]);

  return { status, lastMessage, reconnectAttempt, send, close };
}
