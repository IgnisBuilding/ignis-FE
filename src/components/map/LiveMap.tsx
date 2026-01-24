'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: 'building' | 'fire_station' | 'assembly_point' | 'sensor' | 'incident' | 'current_location' | 'custom';
  color?: string;
  icon?: string;
}

interface LiveMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  showCurrentLocation?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  height?: string;
}

const markerColors: Record<string, string> = {
  building: '#3b82f6',      // blue
  fire_station: '#ef4444',  // red
  assembly_point: '#22c55e', // green
  sensor: '#f59e0b',        // amber
  incident: '#dc2626',      // red-600
  current_location: '#6366f1', // indigo
  custom: '#8b5cf6',        // purple
};

export default function LiveMap({
  markers = [],
  center,
  zoom = 15,
  showCurrentLocation = true,
  onMarkerClick,
  className = '',
  height = '100%'
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current location
  useEffect(() => {
    if (!showCurrentLocation) {
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCurrentPosition(pos);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Unable to get your location. Using default location.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [showCurrentLocation]);

  // Auto-dismiss location error after 3 seconds
  useEffect(() => {
    if (locationError) {
      const timer = setTimeout(() => {
        setLocationError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [locationError]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Determine map center
    const mapCenter = center || currentPosition || [24.8607, 67.0011]; // Default to Karachi if no location

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Create markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isLoading]);

  // Update map center when current position changes
  useEffect(() => {
    if (mapRef.current && currentPosition && !center) {
      mapRef.current.setView(currentPosition, zoom);
    }
  }, [currentPosition, center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add current location marker
    if (showCurrentLocation && currentPosition) {
      const currentLocationMarker = L.marker(currentPosition, {
        icon: L.divIcon({
          className: 'current-location-marker',
          html: `
            <div style="position: relative;">
              <div style="
                width: 20px;
                height: 20px;
                background-color: #6366f1;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
              <div style="
                position: absolute;
                top: -5px;
                left: -5px;
                width: 30px;
                height: 30px;
                background-color: rgba(99, 102, 241, 0.3);
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(markersLayerRef.current);

      currentLocationMarker.bindPopup('<strong>Your Location</strong>');
    }

    // Add other markers
    markers.forEach((marker) => {
      const color = marker.color || markerColors[marker.type] || markerColors.custom;

      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(color)
      }).addTo(markersLayerRef.current!);

      // Create popup content
      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="font-size: 14px;">${marker.title}</strong>
          ${marker.description ? `<p style="margin: 5px 0 0; font-size: 12px; color: #666;">${marker.description}</p>` : ''}
        </div>
      `;
      leafletMarker.bindPopup(popupContent);

      // Handle click
      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }
    });
  }, [markers, currentPosition, showCurrentLocation, onMarkerClick]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-xs shadow-md z-[1000] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <span>{locationError}</span>
          <button
            onClick={() => setLocationError(null)}
            className="text-amber-500 hover:text-amber-700 font-bold ml-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
