'use client';

import { useMemo, useState } from 'react';
import {
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  useEvacueeTracking,
  EvacueePosition,
  EvacuationStats,
} from '@/hooks/use-evacuee-tracking';
import { EvacueeTracker } from './EvacueeTracker';

interface EvacueeDashboardProps {
  buildingId: number;
  onEvacueeSelect?: (userId: number, evacuee: EvacueePosition) => void;
}

type FilterStatus = 'all' | 'navigating' | 'safe' | 'trapped';

export function EvacueeDashboard({
  buildingId,
  onEvacueeSelect,
}: EvacueeDashboardProps) {
  const [selectedEvacuee, setSelectedEvacuee] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const { isConnected, evacuees, routes, stats } = useEvacueeTracking({
    buildingId,
    autoConnect: true,
  });

  const filteredEvacuees = useMemo(() => {
    const evacueeList = Array.from(evacuees.values());

    if (filterStatus === 'all') return evacueeList;

    return evacueeList.filter((e) => e.status === filterStatus);
  }, [evacuees, filterStatus]);

  const handleEvacueeSelect = (userId: number) => {
    setSelectedEvacuee(userId);
    const evacuee = evacuees.get(userId);
    if (evacuee && onEvacueeSelect) {
      onEvacueeSelect(userId, evacuee);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { active: 0, navigating: 0, safe: 0, trapped: 0, offline: 0 };
    evacuees.forEach((e) => {
      if (counts[e.status as keyof typeof counts] !== undefined) {
        counts[e.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [evacuees]);

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary/5 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Live Tracking Active
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Disconnected
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-primary/60">
          <Radio className="w-3 h-3" />
          Building #{buildingId}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Total"
          value={evacuees.size}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          label="Navigating"
          value={statusCounts.navigating}
          icon={Navigation}
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCard
          label="Safe"
          value={statusCounts.safe}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          label="Trapped"
          value={statusCounts.trapped}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Evacuation Progress */}
      {stats && (
        <div className="mb-4 p-4 bg-primary/5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">
              Evacuation Progress
            </span>
            <span className="text-lg font-bold text-primary">
              {Math.round(stats.evacuation_percent)}%
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${stats.evacuation_percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-primary/60">
            <span>{stats.safe} evacuated</span>
            <span>{stats.total_occupants - stats.safe} remaining</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'navigating', 'safe', 'trapped'] as FilterStatus[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }
            `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({statusCounts[status as keyof typeof statusCounts] || 0})
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Evacuee List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredEvacuees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-primary/40">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm">No evacuees in this category</p>
          </div>
        ) : (
          filteredEvacuees.map((evacuee) => (
            <EvacueeTracker
              key={evacuee.user_id}
              evacuee={evacuee}
              route={routes.get(evacuee.user_id)}
              onSelect={handleEvacueeSelect}
              isSelected={selectedEvacuee === evacuee.user_id}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className={`p-3 rounded-xl ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-xs font-medium ${color}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
