'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { EvacueePosition } from '@/components/maps/EvacuationMap';

/**
 * Hook to fetch and listen to peer occupant positions
 * 
 * Features:
 * - Real-time updates via WebSocket (/navigation namespace)
 * - Automatic fallback to REST API if WebSocket fails
 * - Role-based visibility filtering (handled by backend)
 * - Auto-connection retry with exponential backoff
 * - Cleanup on unmount
 * 
 * @param buildingId - Building ID to track occupants for
 * @param floorId - Optional floor ID to filter to specific floor
 * @param userId - Current user ID (for self-awareness)
 * @param userRole - Current user's role (for visibility filtering)
 * @returns Map<userId, EvacueePosition> of visible occupants
 */
export const usePeerPositions = (
  buildingId: number | undefined,
  floorId?: number,
  userId?: number,
  userRole?: 'firefighter' | 'admin' | 'building_authority' | 'evacuee',
) => {
  const [occupants, setOccupants] = useState<Map<number, EvacueePosition>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const restPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWebSocketUpdateRef = useRef<number>(0);
  const REST_POLL_INTERVAL = 5000; // 5 seconds
  const WS_TIMEOUT_THRESHOLD = 10_000; // 10 seconds - fallback to REST if no WS updates

  /**
   * Fetch occupants from REST API (fallback method)
   */
  const fetchFromREST = useCallback(async () => {
    if (!buildingId) return;

    try {
      const params = new URLSearchParams({ building_id: String(buildingId) });
      if (floorId) params.append('floor_id', String(floorId));

      const response = await fetch(`/api/occupants/positions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ignis_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`);
      }

      const data = await response.json();

      // Convert backend response to EvacueePosition map
      if (data.occupants && Array.isArray(data.occupants)) {
        const map = new Map<number, EvacueePosition>();
        
        for (const occ of data.occupants) {
          map.set(occ.user_id, {
            user_id: occ.user_id,
            building_id: buildingId,
            floor_id: occ.floor_id,
            coordinates: [occ.x, occ.y] as [number, number],
            heading: occ.heading,
            status: occ.status || 'active',
            current_instruction: occ.current_instruction,
            progress: occ.progress_percent,
            last_update: occ.last_update || Date.now(),
          });
        }

        setOccupants(map);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch occupants');
      console.error('REST fetch error:', err);
    }
  }, [buildingId, floorId]);

  /**
   * Setup WebSocket connection
   */
  const setupWebSocket = useCallback(() => {
    if (!buildingId || socketRef.current) return;

    try {
      const token = localStorage.getItem('ignis_token');
      if (!token) {
        console.warn('No auth token found, cannot connect to WebSocket');
        return;
      }

      socketRef.current = io(`${window.location.origin}/navigation`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      // Handle connection
      socketRef.current.on('connect', () => {
        console.log('[PeerPositions] WebSocket connected');
        setIsConnected(true);
        setError(null);
      });

      // Handle disconnection
      socketRef.current.on('disconnect', () => {
        console.log('[PeerPositions] WebSocket disconnected, falling back to REST');
        setIsConnected(false);
        // REST polling will handle data updates
      });

      // Listen for occupant position updates
      socketRef.current.on('evacuee.position', (data: any) => {
        lastWebSocketUpdateRef.current = Date.now();

        // Parse position data
        const position: EvacueePosition = {
          user_id: data.user_id,
          building_id: data.building_id,
          floor_id: data.floor_id,
          coordinates: Array.isArray(data.coordinates)
            ? (data.coordinates as [number, number])
            : [data.x, data.y] as [number, number],
          heading: data.heading,
          status: data.status || 'active',
          current_instruction: data.current_instruction,
          progress: data.progress,
          last_update: data.last_update || Date.now(),
        };

        // Filter by floor if specified
        if (floorId && position.floor_id !== floorId) {
          return;
        }

        // Update occupants map
        setOccupants((prev) => {
          const next = new Map(prev);
          next.set(position.user_id, position);
          return next;
        });
      });

      socketRef.current.on('error', (error: any) => {
        console.error('[PeerPositions] WebSocket error:', error);
        setError('WebSocket error: ' + (error?.message || 'Unknown error'));
      });
    } catch (err) {
      console.error('[PeerPositions] WebSocket setup failed:', err);
      setError(err instanceof Error ? err.message : 'WebSocket setup failed');
    }
  }, [buildingId, floorId]);

  /**
   * Setup monitoring to fallback to REST if WebSocket stale
   */
  useEffect(() => {
    if (!buildingId) return;

    // Connect WebSocket
    setupWebSocket();

    // Start REST polling as fallback
    restPollIntervalRef.current = setInterval(() => {
      const timeSinceLastWS = Date.now() - lastWebSocketUpdateRef.current;

      // Use REST if WebSocket silent for > 10 seconds
      if (timeSinceLastWS > WS_TIMEOUT_THRESHOLD || !isConnected) {
        console.log('[PeerPositions] Using REST fallback (WS silent for', timeSinceLastWS, 'ms)');
        fetchFromREST();
      }
    }, REST_POLL_INTERVAL);

    return () => {
      // Cleanup
      if (restPollIntervalRef.current) {
        clearInterval(restPollIntervalRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [buildingId, setupWebSocket, fetchFromREST, isConnected]);

  /**
   * Fetch initial occupants when component mounts
   */
  useEffect(() => {
    if (buildingId) {
      fetchFromREST();
    }
  }, [buildingId, floorId, fetchFromREST]);

  return {
    occupants,
    isConnected,
    error,
    refetch: fetchFromREST,
  };
};
