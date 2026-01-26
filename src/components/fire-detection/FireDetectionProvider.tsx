'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFireDetection, FireDetectionEvent, FireResolvedEvent } from '@/hooks/use-fire-detection';
import { FireAlertBanner } from './FireAlertBanner';

interface FireDetectionContextType {
  isConnected: boolean;
  activeAlerts: FireDetectionEvent[];
  recentDetections: FireDetectionEvent[];
  subscribeToBuilding: (buildingId: number) => void;
  unsubscribeFromBuilding: (buildingId: number) => void;
  clearAlerts: () => void;
}

const FireDetectionContext = createContext<FireDetectionContextType | null>(null);

interface FireDetectionProviderProps {
  children: ReactNode;
  buildingId?: number;
  showBanner?: boolean;
  onViewMap?: (alert: FireDetectionEvent) => void;
}

export function FireDetectionProvider({
  children,
  buildingId,
  showBanner = true,
  onViewMap,
}: FireDetectionProviderProps) {
  const { toast } = useToast();

  const handleFireDetected = useCallback(
    (event: FireDetectionEvent) => {
      // Show toast notification
      toast({
        title: 'Fire Detected!',
        description: `${event.camera_name} - ${(event.confidence * 100).toFixed(1)}% confidence`,
        variant: 'destructive',
      });

      // Play alert sound
      try {
        const audio = new Audio('/sounds/fire-alarm.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore audio play errors (often blocked by browser)
        });
      } catch {
        // Ignore audio errors
      }
    },
    [toast]
  );

  const handleFireResolved = useCallback(
    (event: FireResolvedEvent) => {
      toast({
        title: 'Fire Alert Resolved',
        description: `Hazard #${event.hazard_id} has been resolved`,
      });
    },
    [toast]
  );

  const {
    isConnected,
    activeAlerts,
    recentDetections,
    subscribeToBuilding,
    unsubscribeFromBuilding,
    clearAlerts,
  } = useFireDetection({
    buildingId,
    onFireDetected: handleFireDetected,
    onFireResolved: handleFireResolved,
  });

  const handleDismiss = useCallback(
    (alert: FireDetectionEvent) => {
      // For now just clear all alerts - could be enhanced to dismiss individual ones
      clearAlerts();
    },
    [clearAlerts]
  );

  return (
    <FireDetectionContext.Provider
      value={{
        isConnected,
        activeAlerts,
        recentDetections,
        subscribeToBuilding,
        unsubscribeFromBuilding,
        clearAlerts,
      }}
    >
      {showBanner && (
        <FireAlertBanner
          alerts={activeAlerts}
          onDismiss={handleDismiss}
          onViewMap={onViewMap}
        />
      )}
      {children}
    </FireDetectionContext.Provider>
  );
}

export function useFireDetectionContext() {
  const context = useContext(FireDetectionContext);
  if (!context) {
    throw new Error('useFireDetectionContext must be used within a FireDetectionProvider');
  }
  return context;
}
