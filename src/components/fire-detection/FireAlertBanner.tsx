'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, MapPin, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FireDetectionEvent } from '@/hooks/use-fire-detection';

interface FireAlertBannerProps {
  alerts: FireDetectionEvent[];
  onDismiss?: (alert: FireDetectionEvent) => void;
  onViewMap?: (alert: FireDetectionEvent) => void;
}

export function FireAlertBanner({ alerts, onDismiss, onViewMap }: FireAlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const severityColors = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className={`${severityColors[latestAlert.severity]} text-white shadow-lg`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <AlertTriangle className="h-6 w-6" />
                </motion.div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">FIRE DETECTED</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      {latestAlert.camera_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {latestAlert.location_description || `Building ${latestAlert.building_id}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(latestAlert.timestamp)}
                    </span>
                    <span>
                      Confidence: {(latestAlert.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onViewMap && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewMap(latestAlert)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    View on Map
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDismiss(latestAlert)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable alert list */}
            {alerts.length > 1 && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-white/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {alerts.slice(1, 4).map((alert, index) => (
                    <div
                      key={`${alert.camera_id}-${alert.timestamp}`}
                      className="bg-white/10 rounded-md p-2 text-sm"
                    >
                      <div className="font-medium">{alert.camera_name}</div>
                      <div className="text-white/80 text-xs">
                        {formatTime(alert.timestamp)} - {(alert.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
                {alerts.length > 4 && (
                  <div className="text-sm text-white/80 mt-2">
                    And {alerts.length - 4} more alerts...
                  </div>
                )}
              </motion.div>
            )}

            {alerts.length > 1 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-white/80 hover:text-white underline"
              >
                {isExpanded ? 'Show less' : `Show all ${alerts.length} alerts`}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
