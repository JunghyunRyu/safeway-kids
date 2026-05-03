// C-13 useWebSocket — verify first-message auth, reconnect backoff, ping handling.
// Subpath import bypasses the @safeway/core-mobile root mock from setup.ts.

import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '@safeway/core-mobile/hooks/useWebSocket';

// ── Mock tokenStorage + refreshAccessToken via api/client subpath ───
// Names must be `mock`-prefixed to satisfy jest.mock hoisting.
const mockTokenGetItem = jest.fn().mockResolvedValue('test-access-token');
const mockRefreshFn = jest.fn().mockResolvedValue('refreshed-token');

jest.mock('@safeway/core-mobile/api/client', () => ({
  __esModule: true,
  API_BASE_URL: 'http://localhost:8000/api/v1',
  tokenStorage: {
    getItem: (...args: unknown[]) => mockTokenGetItem(...args),
    setItem: jest.fn(),
    deleteItem: jest.fn(),
  },
  refreshAccessToken: () => mockRefreshFn(),
  default: {},
}));

// ── Manual MockWebSocket ────────────────────────────────────────────
type Listener = ((ev: any) => void) | null;

interface MockSocketHandle {
  url: string;
  sentMessages: string[];
  emitOpen: () => void;
  emitMessage: (data: unknown) => void;
  emitClose: (code: number, reason?: string) => void;
  emitError: (err?: unknown) => void;
}

let lastSocket: MockSocketHandle | null = null;
let socketInstances: MockSocketHandle[] = [];

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = 0;
  onopen: Listener = null;
  onmessage: Listener = null;
  onclose: Listener = null;
  onerror: Listener = null;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    const handle: MockSocketHandle = {
      url,
      sentMessages: this.sentMessages,
      emitOpen: () => {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.({});
      },
      emitMessage: (data: unknown) => {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        this.onmessage?.({ data: payload });
      },
      emitClose: (code: number, reason = '') => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code, reason });
      },
      emitError: (err?: unknown) => {
        this.onerror?.(err ?? {});
      },
    };
    lastSocket = handle;
    socketInstances.push(handle);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  mockTokenGetItem.mockReset().mockResolvedValue('test-access-token');
  mockRefreshFn.mockReset().mockResolvedValue('refreshed-token');
  lastSocket = null;
  socketInstances = [];
  (global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket =
    MockWebSocket;
});

afterEach(() => {
  jest.useRealTimers();
});

// Helper: yield to microtasks
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useWebSocket — first-message auth + reconnect', () => {
  it('connects, sends token, transitions to open after auth_ok', async () => {
    const onOpen = jest.fn();
    const onMessage = jest.fn();

    const { result } = renderHook(() =>
      useWebSocket({
        path: '/pt/ws/walks/sess-1',
        onOpen,
        onMessage,
      }),
    );

    await flush();
    expect(result.current.status).toBe('connecting');
    expect(lastSocket).not.toBeNull();
    expect(lastSocket!.url).toBe(
      'ws://localhost:8000/api/v1/pt/ws/walks/sess-1',
    );

    await act(async () => {
      lastSocket!.emitOpen();
    });
    expect(result.current.status).toBe('authenticating');
    expect(lastSocket!.sentMessages).toHaveLength(1);
    expect(JSON.parse(lastSocket!.sentMessages[0])).toEqual({
      token: 'test-access-token',
    });

    await act(async () => {
      lastSocket!.emitMessage({ type: 'auth_ok' });
    });
    expect(result.current.status).toBe('open');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('forwards subsequent messages and ignores ping', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() =>
      useWebSocket({ path: '/pt/ws/walks/sess-2', onMessage }),
    );
    await flush();
    await act(async () => {
      lastSocket!.emitOpen();
      lastSocket!.emitMessage({ type: 'auth_ok' });
    });

    await act(async () => {
      lastSocket!.emitMessage({ type: 'ping' });
      lastSocket!.emitMessage({ type: 'gps', lat: 37.5, lng: 127.0 });
    });

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({ type: 'gps', lat: 37.5, lng: 127.0 });
    expect(result.current.lastMessage).toEqual({
      type: 'gps', lat: 37.5, lng: 127.0,
    });
  });

  it('reconnects with exponential backoff on close', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        path: '/pt/ws/walks/sess-3',
        maxReconnectAttempts: 3,
        initialBackoffMs: 1000,
      }),
    );
    await flush();
    expect(socketInstances).toHaveLength(1);

    // 1st close → reconnect after 1s
    await act(async () => {
      lastSocket!.emitClose(1006, 'network');
    });
    expect(result.current.reconnectAttempt).toBe(1);
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(socketInstances).toHaveLength(2);

    // 2nd close → reconnect after 2s
    await act(async () => {
      lastSocket!.emitClose(1006, 'network');
    });
    expect(result.current.reconnectAttempt).toBe(2);
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(socketInstances).toHaveLength(3);
  });

  it('reaches failed state after maxReconnectAttempts exhausted', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        path: '/pt/ws/walks/sess-4',
        maxReconnectAttempts: 2,
        initialBackoffMs: 100,
      }),
    );
    await flush();

    // Close 1 → reconnect attempt 1
    await act(async () => {
      lastSocket!.emitClose(1006, 'x');
    });
    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Close 2 → reconnect attempt 2
    await act(async () => {
      lastSocket!.emitClose(1006, 'x');
    });
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Close 3 → exceeds maxReconnectAttempts (2) → failed
    await act(async () => {
      lastSocket!.emitClose(1006, 'x');
    });
    expect(result.current.status).toBe('failed');
  });

  it('does not reconnect on permanent close codes (4003 forbidden)', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ path: '/pt/ws/walks/sess-5' }),
    );
    await flush();

    await act(async () => {
      lastSocket!.emitClose(4003, 'Forbidden');
    });

    expect(result.current.status).toBe('failed');
    expect(result.current.reconnectAttempt).toBe(0);

    await act(async () => {
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
    });
    expect(socketInstances).toHaveLength(1);
  });
});
