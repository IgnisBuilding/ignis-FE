'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFireDetection, FireDetectionEvent, FireResolvedEvent } from '@/hooks/use-fire-detection';
import { FireAlertBanner } from './FireAlertBanner';

/**
 * Plays a 3-beep fire alarm via the Web Audio API. No asset file needed
 * (the previous /sounds/fire-alarm.mp3 path does not exist). Silently
 * no-ops when AudioContext is unavailable or blocked by autoplay policy.
 */
function playFireAlertBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (startOffset: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + 0.18);
    };
    beep(0.0);
    beep(0.3);
    beep(0.6);
    setTimeout(() => {
      ctx.close().catch(() => {
        /* ignore */
      });
    }, 1200);
  } catch {
    /* blocked by autoplay policy or AudioContext unavailable */
  }
}

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
  // Mirror of the suppressAlarmUntilRef in use-fire-detection; set when fire is resolved
  // so hazard.created:building beeps are also silenced during the suppression window.
  const suppressAlarmUntilRef = React.useRef<number>(0);

  const handleFireDetected = useCallback(
    (event: FireDetectionEvent) => {
      toast({
        title: 'Fire Detected!',
        description: `${event.camera_name} - ${(event.confidence * 100).toFixed(1)}% confidence`,
        variant: 'destructive',
      });
      // Alarm sound is guarded by suppressAlarmUntilRef inside use-fire-detection —
      // this callback is only invoked when the suppression window has passed.
      playFireAlertBeep();
    },
    [toast]
  );

  const handleHazardCreated = useCallback(
    (_hazard: unknown) => {
      toast({
        title: 'Fire Placed',
        description: 'A fire hazard has been placed in this building.',
        variant: 'destructive',
      });
      // Respect suppression window (set by handleFireResolved below)
      if (Date.now() < suppressAlarmUntilRef.current) return;
      playFireAlertBeep();
    },
    [toast]
  );

  const handleFireResolved = useCallback(
    (event: FireResolvedEvent) => {
      toast({
        title: 'Fire Alert Resolved',
        description: `Hazard #${event.hazard_id} has been resolved`,
      });
      // Suppress alarm for 5 minutes — mirrors use-fire-detection suppressAlarmUntilRef
      suppressAlarmUntilRef.current = Date.now() + 5 * 60 * 1000;
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
    onHazardCreated: handleHazardCreated,
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
