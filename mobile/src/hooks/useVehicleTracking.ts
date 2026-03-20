import { useCallback, useEffect, useRef, useState } from "react";
import { GpsLocation, getVehicleLocation } from "../api/vehicles";
import { API_BASE_URL, tokenStorage, refreshAccessToken } from "../api/client";
import { debugLog, debugWarn } from "../utils/debug";

const INITIAL_RETRY_MS = 3000;
const MAX_RETRY_MS = 30000;
const POLL_INTERVAL_MS = 3000;
const WS_MAX_FAILURES_BEFORE_POLL = 3;
const WS_RETRY_FROM_POLL_MS = 30000;

// Close codes that indicate permanent failure — do not retry at all
const PERMANENT_CLOSE_CODES = new Set([4003, 403, 1008]);

export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "polling"
  | "auth_failed"
  | "error";

interface VehicleTrackingOptions {
  vehicleIds: string[];
  enabled: boolean;
}

interface VehicleTrackingResult {
  locations: Map<string, GpsLocation>;
  connectionState: ConnectionState;
  connected: boolean; // backward compat
}

/**
 * Decode JWT payload without verification to check expiry.
 * Returns true if token is present and not expired (with 60s margin).
 */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (!exp) return false;
    return exp > Date.now() / 1000 + 60; // 60s safety margin
  } catch {
    return false;
  }
}

/**
 * Ensure we have a valid, unexpired access token.
 * Attempts refresh if the current token is missing or expired.
 */
async function ensureValidToken(): Promise<string | null> {
  const token = await tokenStorage.getItem("access_token");
  if (isTokenValid(token)) return token;

  debugLog("[WS] Token missing or expired, attempting refresh...");
  const newToken = await refreshAccessToken();
  if (newToken) {
    debugLog("[WS] Token refreshed successfully");
  } else {
    debugWarn("[WS] Token refresh failed");
  }
  return newToken;
}

export function useVehicleTracking({
  vehicleIds,
  enabled,
}: VehicleTrackingOptions): VehicleTrackingResult {
  const [locations, setLocations] = useState<Map<string, GpsLocation>>(new Map());
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const wsRefs = useRef<WebSocket[]>([]);
  const retryTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const retryDelays = useRef<Map<string, number>>(new Map());
  const wsFailCount = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRetryFromPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRetried = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup all WS connections
  const cleanupWs = useCallback(() => {
    wsRefs.current.forEach((ws) => ws.close());
    wsRefs.current = [];
    retryTimeouts.current.forEach(clearTimeout);
    retryTimeouts.current = [];
  }, []);

  // Cleanup polling
  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (wsRetryFromPollRef.current) {
      clearTimeout(wsRetryFromPollRef.current);
      wsRetryFromPollRef.current = null;
    }
  }, []);

  // Start HTTP polling fallback
  const startPolling = useCallback(
    (ids: string[]) => {
      if (pollIntervalRef.current) return; // already polling
      debugLog("[WS] Switching to HTTP polling fallback");
      setConnectionState("polling");

      const poll = async () => {
        for (const vid of ids) {
          try {
            const loc = await getVehicleLocation(vid);
            if (loc && mountedRef.current) {
              setLocations((prev) => {
                const next = new Map(prev);
                next.set(vid, loc);
                return next;
              });
            }
          } catch {
            // silent — keep polling
          }
        }
      };

      poll(); // immediate first poll
      pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    },
    []
  );

  const connectWs = useCallback(
    async (vehicleId: string, allIds: string[]) => {
      if (!enabled || !mountedRef.current) return;

      // Ensure valid token before connecting
      let token: string | null = null;
      try {
        token = await ensureValidToken();
      } catch (err) {
        debugWarn("[WS] Token fetch error:", err);
      }
      if (!token) {
        debugWarn("[WS] No valid token available, setting auth_failed");
        if (mountedRef.current) setConnectionState("auth_failed");
        return;
      }

      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      const url = `${wsBase}/telemetry/ws/vehicles/${vehicleId}?token=${token}`;
      debugLog(`[WS] Connecting: vehicle=${vehicleId.slice(0, 8)}...`);
      if (mountedRef.current) setConnectionState("connecting");

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        debugWarn("[WS] WebSocket constructor error:", err);
        if (mountedRef.current) setConnectionState("error");
        return;
      }

      ws.onopen = () => {
        debugLog(`[WS] Connected: vehicle=${vehicleId.slice(0, 8)}`);
        if (mountedRef.current) {
          setConnectionState("connected");
          wsFailCount.current = 0;
          authRetried.current = false;
          retryDelays.current.set(vehicleId, INITIAL_RETRY_MS);
          // Stop polling if it was active
          cleanupPolling();
        }
      };

      ws.onmessage = (event) => {
        try {
          const loc: GpsLocation = JSON.parse(event.data);
          if (mountedRef.current) {
            setLocations((prev) => {
              const next = new Map(prev);
              next.set(vehicleId, loc);
              return next;
            });
          }
        } catch {
          // ignore parse errors (e.g., ping messages)
        }
      };

      ws.onclose = (event) => {
        debugWarn(`[WS] Closed: code=${event.code} reason="${event.reason}" vehicle=${vehicleId.slice(0, 8)}`);
        if (!mountedRef.current || !enabled) return;

        // Permanent failure — never retry
        if (PERMANENT_CLOSE_CODES.has(event.code)) {
          debugWarn(`[WS] Permanent failure (code ${event.code}), not retrying`);
          setConnectionState("error");
          return;
        }

        // Auth failure (4001) — try token refresh once
        if (event.code === 4001 && !authRetried.current) {
          debugLog("[WS] Auth failure, attempting token refresh + retry...");
          authRetried.current = true;
          refreshAccessToken()
            .then((newToken) => {
              if (!mountedRef.current) return;
              if (newToken) {
                debugLog("[WS] Token refreshed, retrying WS connection...");
                setConnectionState("reconnecting");
                connectWs(vehicleId, allIds).catch((err) =>
                  debugWarn("[WS] reconnect error:", err)
                );
              } else {
                debugWarn("[WS] Token refresh failed, auth_failed");
                setConnectionState("auth_failed");
              }
            })
            .catch((err) => {
              debugWarn("[WS] refreshAccessToken error:", err);
              if (mountedRef.current) setConnectionState("auth_failed");
            });
          return;
        }

        // Auth failure after retry — give up
        if (event.code === 4001 && authRetried.current) {
          debugWarn("[WS] Auth still failing after refresh, auth_failed");
          setConnectionState("auth_failed");
          return;
        }

        // Non-auth failure — increment fail count
        wsFailCount.current += 1;

        // Switch to polling after too many failures
        if (wsFailCount.current >= WS_MAX_FAILURES_BEFORE_POLL) {
          startPolling(allIds);
          // Periodically retry WS from polling mode
          wsRetryFromPollRef.current = setTimeout(() => {
            debugLog("[WS] Retrying WS from polling mode...");
            wsFailCount.current = 0;
            cleanupPolling();
            connectWs(vehicleId, allIds).catch((err) =>
              debugWarn("[WS] poll-retry error:", err)
            );
          }, WS_RETRY_FROM_POLL_MS);
          return;
        }

        // Exponential backoff reconnect
        setConnectionState("reconnecting");
        const currentDelay = retryDelays.current.get(vehicleId) ?? INITIAL_RETRY_MS;
        const timeout = setTimeout(() => {
          connectWs(vehicleId, allIds).catch((err) =>
            debugWarn("[WS] retry error:", err)
          );
        }, currentDelay);
        retryTimeouts.current.push(timeout);
        retryDelays.current.set(vehicleId, Math.min(currentDelay * 2, MAX_RETRY_MS));
      };

      ws.onerror = (err) => {
        debugWarn(`[WS] Error: vehicle=${vehicleId.slice(0, 8)}`, err);
        ws.close();
      };

      wsRefs.current.push(ws);
    },
    [enabled, cleanupPolling, startPolling]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || vehicleIds.length === 0) {
      cleanupWs();
      cleanupPolling();
      setConnectionState("idle");
      return;
    }

    // Reset state
    wsFailCount.current = 0;
    authRetried.current = false;

    // Connect to each vehicle
    vehicleIds.forEach((vid) => {
      connectWs(vid, vehicleIds).catch((err) => {
        debugWarn("[WS] connectWs unhandled error:", err);
      });
    });

    return () => {
      mountedRef.current = false;
      cleanupWs();
      cleanupPolling();
    };
  }, [vehicleIds, enabled, connectWs, cleanupWs, cleanupPolling]);

  return {
    locations,
    connectionState,
    connected: connectionState === "connected" || connectionState === "polling",
  };
}
