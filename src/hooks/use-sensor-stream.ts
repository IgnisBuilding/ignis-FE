'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface SensorReadingEvent {
  sensor_id: number;
  sensor_key?: 'MQ7' | 'MQ5' | string;
  name: string;
  type: string;
  value: number;
  unit?: string;
  status: 'safe' | 'warning' | 'alert' | string;
  timestamp: number;
  room_id?: number;
  floor_id?: number;
  building_id?: number;
}

export interface SensorConnectionEvent {
  source: 'arduino' | string;
  mode?: 'mock' | 'hardware' | string;
  connected: boolean;
  port?: string;
  timestamp: number;
}

interface UseSensorStreamOptions {
  autoConnect?: boolean;
  onSensorReading?: (event: SensorReadingEvent) => void;
  onSensorAlert?: (event: SensorReadingEvent) => void;
  onSensorConnection?: (event: SensorConnectionEvent) => void;
}

interface UseSensorStreamReturn {
  isConnected: boolean;
  latestConnection: SensorConnectionEvent | null;
  connect: () => void;
  disconnect: () => void;
}

export function useSensorStream(options: UseSensorStreamOptions = {}): UseSensorStreamReturn {
  const {
    autoConnect = true,
    onSensorReading,
    onSensorAlert,
    onSensorConnection,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [latestConnection, setLatestConnection] = useState<SensorConnectionEvent | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const onSensorReadingRef = useRef(onSensorReading);
  const onSensorAlertRef = useRef(onSensorAlert);
  const onSensorConnectionRef = useRef(onSensorConnection);

  useEffect(() => {
    onSensorReadingRef.current = onSensorReading;
  }, [onSensorReading]);

  useEffect(() => {
    onSensorAlertRef.current = onSensorAlert;
  }, [onSensorAlert]);

  useEffect(() => {
    onSensorConnectionRef.current = onSensorConnection;
  }, [onSensorConnection]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${WS_URL}/fire-detection`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('sensor.reading', (event: SensorReadingEvent) => {
      onSensorReadingRef.current?.(event);
    });

    socket.on('sensor.alert', (event: SensorReadingEvent) => {
      onSensorAlertRef.current?.(event);
    });

    socket.on('sensor.connection', (event: SensorConnectionEvent) => {
      setLatestConnection(event);
      onSensorConnectionRef.current?.(event);
    });

    socket.on('error', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    latestConnection,
    connect,
    disconnect,
  };
}
