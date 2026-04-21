import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type Role = 'EVACUEE' | 'RESPONDER' | 'ADMIN';

export interface OccupantPosition {
  occupant_id: string;
  role: Role;
  display_name: string;
  building_id?: number;
  floor?: number;
  floor_id?: number;
  node_id: string;
  lat: number;
  lng: number;
  heading?: number;
  accuracy: number;
  timestamp: number;
}

export default function usePeerPositions(
  myRole: Role | string,
  options: { buildingId?: number; floorId?: number } = {}
) {
  const { buildingId, floorId } = options;
  const [positions, setPositions] = useState<OccupantPosition[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<number | null>(null);
  const backoffRef = useRef(500);

  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') || '';
    let stopped = false;

    const startWS = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const token = (typeof window !== 'undefined' && (localStorage.getItem('ignis_token') || localStorage.getItem('token') || '')) || '';
      const socket = io(url + '/occupants', {
        auth: { token: token ? `Bearer ${token}` : '' },
        query: {
          ...(buildingId !== undefined ? { buildingId: String(buildingId) } : {}),
          ...(floorId !== undefined ? { floorId: String(floorId) } : {}),
        },
        transports: ['websocket'],
        reconnection: false,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        backoffRef.current = 500;
        setConnected(true);
        // stop polling if active
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      });

      socket.on('disconnect', () => {
        setConnected(false);
        if (!stopped) scheduleReconnect();
      });

      socket.on('positions_update', (msg: { event: string; data: OccupantPosition[] }) => {
        setPositions(msg.data || []);
      });

      socket.on('connect_error', () => {
        setConnected(false);
        scheduleReconnect();
      });
    };

    const scheduleReconnect = () => {
      // start polling fallback if not already
      if (!pollRef.current) {
        fetchAndSet();
        pollRef.current = window.setInterval(fetchAndSet, 5000);
      }

      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
      setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) return;
        startWS();
      }, delay);
    };

    const fetchAndSet = async () => {
      try {
        const token = (typeof window !== 'undefined' && (localStorage.getItem('ignis_token') || localStorage.getItem('token') || '')) || '';
        const params = new URLSearchParams();
        if (buildingId !== undefined) params.set('buildingId', String(buildingId));
        if (floorId !== undefined) params.set('floorId', String(floorId));
        const resp = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')}/occupants/positions${params.toString() ? `?${params.toString()}` : ''}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!resp.ok) return;
        const body = await resp.json();
        setPositions(body.data || []);
      } catch (e) {
        // ignore
      }
    };

    startWS();
    fetchAndSet();

    return () => {
      stopped = true;
      if (socketRef.current) socketRef.current.disconnect();
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [myRole, buildingId, floorId]);

  return { positions, connected };
}
