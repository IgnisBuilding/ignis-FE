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
    if (socketRef.current?.connected) return;

    console.log('[EvacueeTracking WS] Connecting to:', `${WS_URL}/navigation`);

    const socket = io(`${WS_URL}/navigation`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[EvacueeTracking WS] Connected');
      if (mountedRef.current) {
        setIsConnected(true);
      }
    });

    socket.on('disconnect', () => {
      console.log('[EvacueeTracking WS] Disconnected');
      if (mountedRef.current) {
        setIsConnected(false);
      }
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
    });

    // Evacuation stats update
    socket.on('evacuation.stats', (statsData: EvacuationStats) => {
      console.log('[EvacueeTracking WS] Stats update:', statsData);
      if (mountedRef.current) {
        setStats(statsData);
      }
      callbacksRef.current.onStatsUpdate?.(statsData);
    });

    socket.on('error', (error) => {
      console.error('[EvacueeTracking WS] Error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('[EvacueeTracking WS] Connection error:', error.message);
    });

    socketRef.current = socket;
  }, []); // No dependencies - stable reference

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
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
