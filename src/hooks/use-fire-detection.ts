'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface FireDetectionEvent {
  camera_id: string;
  camera_name: string;
  building_id: number;
  floor_id?: number;
  room_id?: number;
  confidence: number;
  timestamp: number;
  hazard_id?: number;
  severity: 'critical' | 'high' | 'medium';
  location_description?: string;
}

export interface FireResolvedEvent {
  hazard_id: number;
  building_id: number;
  resolved_by?: string;
}

interface UseFireDetectionOptions {
  buildingId?: number;
  onFireDetected?: (event: FireDetectionEvent) => void;
  onFireResolved?: (event: FireResolvedEvent) => void;
  autoConnect?: boolean;
}

interface UseFireDetectionReturn {
  isConnected: boolean;
  recentDetections: FireDetectionEvent[];
  activeAlerts: FireDetectionEvent[];
  connect: () => void;
  disconnect: () => void;
  subscribeToBuilding: (buildingId: number) => void;
  unsubscribeFromBuilding: (buildingId: number) => void;
  clearAlerts: () => void;
}

export function useFireDetection(options: UseFireDetectionOptions = {}): UseFireDetectionReturn {
  const { buildingId, onFireDetected, onFireResolved, autoConnect = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [recentDetections, setRecentDetections] = useState<FireDetectionEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<FireDetectionEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${WS_URL}/fire-detection`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[FireDetection WS] Connected');
      setIsConnected(true);

      // Subscribe to building if specified
      if (buildingId) {
        socket.emit('subscribe:building', buildingId);
      }
    });

    socket.on('disconnect', () => {
      console.log('[FireDetection WS] Disconnected');
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('[FireDetection WS] Server acknowledged:', data);
    });

    socket.on('fire.detected', (event: FireDetectionEvent) => {
      console.log('[FireDetection WS] Fire detected:', event);

      setRecentDetections((prev) => [event, ...prev.slice(0, 49)]); // Keep last 50
      setActiveAlerts((prev) => {
        // Add to active alerts if not already present
        const exists = prev.some(
          (a) => a.camera_id === event.camera_id && a.timestamp === event.timestamp
        );
        if (exists) return prev;
        return [event, ...prev];
      });

      onFireDetected?.(event);
    });

    socket.on('fire.detected:building', (event: FireDetectionEvent) => {
      console.log('[FireDetection WS] Fire detected in subscribed building:', event);
    });

    socket.on('fire.resolved', (event: FireResolvedEvent) => {
      console.log('[FireDetection WS] Fire resolved:', event);

      setActiveAlerts((prev) => prev.filter((a) => a.hazard_id !== event.hazard_id));

      onFireResolved?.(event);
    });

    socket.on('error', (error) => {
      console.error('[FireDetection WS] Error:', error);
    });

    socketRef.current = socket;
  }, [buildingId, onFireDetected, onFireResolved]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribeToBuilding = useCallback((id: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:building', id);
    }
  }, []);

  const unsubscribeFromBuilding = useCallback((id: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:building', id);
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Subscribe to building when it changes
  useEffect(() => {
    if (buildingId && isConnected) {
      subscribeToBuilding(buildingId);
    }
  }, [buildingId, isConnected, subscribeToBuilding]);

  return {
    isConnected,
    recentDetections,
    activeAlerts,
    connect,
    disconnect,
    subscribeToBuilding,
    unsubscribeFromBuilding,
    clearAlerts,
  };
}
