import { useCallback, useEffect, useRef, useState } from "react";
import { GpsLocation } from "../api/vehicles";
import { API_BASE_URL, tokenStorage } from "../api/client";

const INITIAL_RETRY_MS = 3000;
const MAX_RETRY_MS = 30000;
// Close codes that indicate auth/permission failure — do not retry
const NO_RETRY_CODES = new Set([4001, 4003, 403, 1008]);

interface VehicleTrackingOptions {
  vehicleIds: string[];
  enabled: boolean;
}

interface VehicleTrackingResult {
  locations: Map<string, GpsLocation>;
  connected: boolean;
}

export function useVehicleTracking({
  vehicleIds,
  enabled,
}: VehicleTrackingOptions): VehicleTrackingResult {
  const [locations, setLocations] = useState<Map<string, GpsLocation>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRefs = useRef<WebSocket[]>([]);
  const retryTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const retryDelays = useRef<Map<string, number>>(new Map());

  const connectWs = useCallback(
    async (vehicleId: string) => {
      if (!enabled) return;

      // Build WebSocket URL from API base, include auth token
      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      const token = await tokenStorage.getItem("access_token");
      const url = token
        ? `${wsBase}/telemetry/ws/vehicles/${vehicleId}?token=${token}`
        : `${wsBase}/telemetry/ws/vehicles/${vehicleId}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnected(true);
        retryDelays.current.set(vehicleId, INITIAL_RETRY_MS);
      };

      ws.onmessage = (event) => {
        try {
          const loc: GpsLocation = JSON.parse(event.data);
          setLocations((prev) => {
            const next = new Map(prev);
            next.set(vehicleId, loc);
            return next;
          });
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        if (!enabled) return;

        // Do not retry on auth/permission errors
        if (NO_RETRY_CODES.has(event.code)) {
          console.warn(`WebSocket closed with code ${event.code}, not retrying`);
          return;
        }

        // Exponential backoff reconnect
        const currentDelay = retryDelays.current.get(vehicleId) ?? INITIAL_RETRY_MS;
        const timeout = setTimeout(() => {
          connectWs(vehicleId);
        }, currentDelay);

        retryTimeouts.current.push(timeout);
        retryDelays.current.set(
          vehicleId,
          Math.min(currentDelay * 2, MAX_RETRY_MS)
        );
      };

      ws.onerror = () => {
        // Let onclose handle retry logic
        ws.close();
      };

      wsRefs.current.push(ws);
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled || vehicleIds.length === 0) {
      // Cleanup
      wsRefs.current.forEach((ws) => ws.close());
      wsRefs.current = [];
      retryTimeouts.current.forEach(clearTimeout);
      retryTimeouts.current = [];
      setConnected(false);
      return;
    }

    vehicleIds.forEach(connectWs);

    return () => {
      wsRefs.current.forEach((ws) => ws.close());
      wsRefs.current = [];
      retryTimeouts.current.forEach(clearTimeout);
      retryTimeouts.current = [];
    };
  }, [vehicleIds, enabled, connectWs]);

  return { locations, connected };
}
