'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface EvacueePosition {
  user_id: number;
  building_id: number;
  floor_id: number;
  coordinates: [number, number];
  heading?: number;
  status: 'active' | 'navigating' | 'safe' | 'trapped' | 'offline';
  current_instruction?: string;
  progress?: number;
  last_update: number;
}

export interface EvacueeRoute {
  user_id: number;
  geometry: object;
  instructions: TurnInstruction[];
}

export interface TurnInstruction {
  index: number;
  type: string;
  distance_meters: number;
  cumulative_distance: number;
  node_id: number;
  coordinates: [number, number];
  floor_id: number;
  floor_name: string;
  heading: number;
  text: string;
  voice_text: string;
  landmark?: string;
  is_floor_change: boolean;
  warning?: string;
}

export interface EvacuationStats {
  building_id: number;
  total_occupants: number;
  evacuating: number;
  safe: number;
  trapped: number;
  unknown: number;
  evacuation_percent: number;
  timestamp: number;
}

export interface EvacueeSafeEvent {
  user_id: number;
  timestamp: number;
}

export interface EvacueeTrappedEvent {
  user_id: number;
  safe_point: {
    node_id: number;
    floor_id: number;
    coordinates: [number, number];
    name: string;
  };
  timestamp: number;
}

interface UseEvacueeTrackingOptions {
  buildingId?: number;
  onEvacueePositionUpdate?: (position: EvacueePosition) => void;
  onEvacueeRouteUpdate?: (route: EvacueeRoute) => void;
  onEvacueeSafe?: (event: EvacueeSafeEvent) => void;
  onEvacueeTrapped?: (event: EvacueeTrappedEvent) => void;
  onStatsUpdate?: (stats: EvacuationStats) => void;
  autoConnect?: boolean;
}

interface UseEvacueeTrackingReturn {
  isConnected: boolean;
  evacuees: Map<number, EvacueePosition>;
  routes: Map<number, EvacueeRoute>;
  stats: EvacuationStats | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToBuilding: (buildingId: number) => void;
  unsubscribeFromBuilding: (buildingId: number) => void;
}

export function useEvacueeTracking(
  options: UseEvacueeTrackingOptions = {}
): UseEvacueeTrackingReturn {
  const {
    buildingId,
    onEvacueePositionUpdate,
    onEvacueeRouteUpdate,
    onEvacueeSafe,
    onEvacueeTrapped,
    onStatsUpdate,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [evacuees, setEvacuees] = useState<Map<number, EvacueePosition>>(
    () => new Map()
  );
  const [routes, setRoutes] = useState<Map<number, EvacueeRoute>>(() => new Map());
  const [stats, setStats] = useState<EvacuationStats | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const pollRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onEvacueePositionUpdate,
    onEvacueeRouteUpdate,
    onEvacueeSafe,
    onEvacueeTrapped,
    onStatsUpdate,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onEvacueePositionUpdate,
      onEvacueeRouteUpdate,
      onEvacueeSafe,
      onEvacueeTrapped,
      onStatsUpdate,
    };
  }, [onEvacueePositionUpdate, onEvacueeRouteUpdate, onEvacueeSafe, onEvacueeTrapped, onStatsUpdate]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (socketRef.current?.connected) return;

    console.log('[EvacueeTracking WS] Connecting to:', `${WS_URL}/navigation`);
    const token =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('ignis_token') || localStorage.getItem('token') || '')) ||
      '';

    const socket = io(`${WS_URL}/navigation`, {
      auth: { token: token ? `Bearer ${token}` : '' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const stopPolling = () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
    };

    const fetchFallbackSnapshot = async () => {
      try {
        const token =
          (typeof window !== 'undefined' &&
            (localStorage.getItem('ignis_token') || localStorage.getItem('token') || '')) ||
          '';
        const params = new URLSearchParams();
        if (buildingId !== undefined) params.set('buildingId', String(buildingId));

        const resp = await fetch(
          `${WS_URL}/occupants/positions${params.toString() ? `?${params.toString()}` : ''}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!resp.ok) return;

        const body = await resp.json();
        const list = Array.isArray(body?.data) ? body.data : [];
        if (!mountedRef.current) return;

        setEvacuees((prev) => {
          const updated = new Map(prev);
          for (const p of list) {
            const userId = Number.parseInt(String(p.occupant_id), 10);
            const lng = Number(p.lng);
            const lat = Number(p.lat);
            if (!Number.isFinite(userId) || !Number.isFinite(lng) || !Number.isFinite(lat)) {
              continue;
            }
            updated.set(userId, {
              user_id: userId,
              building_id: Number(p.building_id ?? buildingId ?? 0),
              floor_id: Number(p.floor_id ?? p.floor ?? 0),
              coordinates: [lng, lat],
              heading: p.heading !== undefined ? Number(p.heading) : undefined,
              status: 'active',
              current_instruction: undefined,
              progress: undefined,
              last_update: Number(p.timestamp ?? Date.now()),
            });
          }
          return updated;
        });
      } catch (error) {
        console.error('[EvacueeTracking REST fallback] Error:', error);
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      fetchFallbackSnapshot();
      pollRef.current = window.setInterval(fetchFallbackSnapshot, 5000);
    };

    fallbackTimeoutRef.current = window.setTimeout(() => {
      if (!socket.connected && mountedRef.current) {
        console.warn('[EvacueeTracking WS] No connection after timeout, starting REST fallback polling');
        startPolling();
      }
    }, 5000);

    socket.on('connect', () => {
      console.log('[EvacueeTracking WS] Connected');
      if (mountedRef.current) {
        setIsConnected(true);
      }
      stopPolling();
    });

    socket.on('disconnect', () => {
      console.log('[EvacueeTracking WS] Disconnected');
      if (mountedRef.current) {
        setIsConnected(false);
      }
      startPolling();
    });

    socket.on('connected', (data) => {
      console.log('[EvacueeTracking WS] Server acknowledged:', data);
    });

    socket.on('subscribed', (data) => {
      console.log('[EvacueeTracking WS] Subscribed to:', data);
    });

    // Real-time position updates from evacuees
    socket.on('evacuee.position', (position: EvacueePosition) => {
      console.log('[EvacueeTracking WS] Position update:', position);

      if (mountedRef.current) {
        setEvacuees((prev) => {
          const updated = new Map(prev);
          updated.set(position.user_id, position);
          return updated;
        });
      }

      callbacksRef.current.onEvacueePositionUpdate?.(position);
      stopPolling();
    });

    // Route updates when evacuee starts navigation or gets rerouted
    socket.on('evacuee.route', (route: EvacueeRoute) => {
      console.log('[EvacueeTracking WS] Route update:', route);

      if (mountedRef.current) {
        setRoutes((prev) => {
          const updated = new Map(prev);
          updated.set(route.user_id, route);
          return updated;
        });
      }

      callbacksRef.current.onEvacueeRouteUpdate?.(route);
      stopPolling();
    });

    // Evacuee reached safety
    socket.on('evacuee.safe', (event: EvacueeSafeEvent) => {
      console.log('[EvacueeTracking WS] Evacuee safe:', event);

      if (mountedRef.current) {
        setEvacuees((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(event.user_id);
          if (existing) {
            updated.set(event.user_id, { ...existing, status: 'safe' });
          }
          return updated;
        });

        // Remove route for safe evacuee
        setRoutes((prev) => {
          const updated = new Map(prev);
          updated.delete(event.user_id);
          return updated;
        });
      }

      callbacksRef.current.onEvacueeSafe?.(event);
      stopPolling();
    });

    // Evacuee trapped
    socket.on('evacuee.trapped', (event: EvacueeTrappedEvent) => {
      console.log('[EvacueeTracking WS] Evacuee trapped:', event);

      if (mountedRef.current) {
        setEvacuees((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(event.user_id);
          if (existing) {
            updated.set(event.user_id, { ...existing, status: 'trapped' });
          }
          return updated;
        });
      }

      callbacksRef.current.onEvacueeTrapped?.(event);
      stopPolling();
    });

    // Evacuation stats update
    socket.on('evacuation.stats', (statsData: EvacuationStats) => {
      console.log('[EvacueeTracking WS] Stats update:', statsData);
      if (mountedRef.current) {
        setStats(statsData);
      }
      callbacksRef.current.onStatsUpdate?.(statsData);
      stopPolling();
    });

    socket.on('error', (error) => {
      console.error('[EvacueeTracking WS] Error:', error);
      startPolling();
    });

    socket.on('connect_error', (error) => {
      console.error('[EvacueeTracking WS] Connection error:', error.message);
      startPolling();
    });

    socketRef.current = socket;
  }, []); // No dependencies - stable reference

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []); // No dependencies - stable reference

  const subscribeToBuilding = useCallback((id: number) => {
    if (socketRef.current?.connected) {
      console.log('[EvacueeTracking WS] Subscribing to building:', id);
      socketRef.current.emit('subscribe:building:tracking', { buildingId: id });
    }
  }, []);

  const unsubscribeFromBuilding = useCallback((id: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:building:tracking', {
        buildingId: id,
      });
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect]); // Only depend on autoConnect, not on connect/disconnect

  // Subscribe to building when connected and buildingId is available
  useEffect(() => {
    if (buildingId && isConnected) {
      subscribeToBuilding(buildingId);
    }
  }, [buildingId, isConnected, subscribeToBuilding]);

  return {
    isConnected,
    evacuees,
    routes,
    stats,
    connect,
    disconnect,
    subscribeToBuilding,
    unsubscribeFromBuilding,
  };
}
