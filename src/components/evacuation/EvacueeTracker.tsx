'use client';

import { useMemo } from 'react';
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { EvacueePosition, EvacueeRoute } from '@/hooks/use-evacuee-tracking';

interface EvacueeTrackerProps {
  evacuee: EvacueePosition;
  route?: EvacueeRoute;
  onSelect?: (userId: number) => void;
  isSelected?: boolean;
}

const STATUS_CONFIG = {
  active: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: Circle,
    label: 'Active',
  },
  navigating: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    icon: Navigation,
    label: 'Navigating',
  },
  safe: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    label: 'Safe',
  },
  trapped: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
    label: 'Trapped',
  },
  offline: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: Circle,
    label: 'Offline',
  },
};

export function EvacueeTracker({
  evacuee,
  route,
  onSelect,
  isSelected,
}: EvacueeTrackerProps) {
  const statusConfig = STATUS_CONFIG[evacuee.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  const timeSinceUpdate = useMemo(() => {
    const seconds = Math.floor((Date.now() - evacuee.last_update) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }, [evacuee.last_update]);

  const currentInstruction = route?.instructions?.[0];

  return (
    <div
      onClick={() => onSelect?.(evacuee.user_id)}
      className={`
        p-4 rounded-xl border-2 cursor-pointer transition-all
        ${statusConfig.borderColor} ${statusConfig.bgColor}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-md'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-primary">User #{evacuee.user_id}</p>
            <div className="flex items-center gap-2 text-sm text-primary/60">
              <span className={`font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-primary/40">|</span>
              <span>Floor {evacuee.floor_id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-primary/50">
          <Clock className="w-3 h-3" />
          {timeSinceUpdate}
        </div>
      </div>

      {/* Progress bar for navigating evacuees */}
      {evacuee.status === 'navigating' && evacuee.progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-primary/60">Progress</span>
            <span className="font-medium text-primary">
              {Math.round(evacuee.progress)}%
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${evacuee.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current instruction */}
      {evacuee.current_instruction && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-primary/80 truncate">{evacuee.current_instruction}</p>
        </div>
      )}

      {/* Location coordinates */}
      <div className="mt-3 flex items-center gap-2 text-xs text-primary/50">
        <MapPin className="w-3 h-3" />
        <span>
          ({evacuee.coordinates[0].toFixed(1)}, {evacuee.coordinates[1].toFixed(1)})
        </span>
        {evacuee.heading !== undefined && (
          <>
            <span className="text-primary/30">|</span>
            <span>Heading: {Math.round(evacuee.heading)}°</span>
          </>
        )}
      </div>
    </div>
  );
}
