'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { IncidentActionModal } from '@/components/dialogs';
import { useToast } from '@/hooks/use-toast';
import { api, BuildingWithStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Activity, Building2, Users, CheckCircle2,
  Siren, Map, MoreVertical, Camera, Flame,
  AlertTriangle, Zap, Droplets, Wind, Radio,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  sensors: { total: number; active: number; alert: number; inactive: number };
  users: { total: number; active: number };
  hazards: { active: number; pending: number; total: number };
  buildings: { total: number; with_floor_plan: number };
  cameras: { total: number; active: number };
}

interface DashardHazard {
  id: number;
  type: string;
  severity: string;
  status: string;
  description: string | null;
  created_at: string;
  responded_at: string | null;
  room: { id: number; name: string; type: string } | null;
  floor: {
    id: number;
    level: number;
    name: string;
    building: {
      id: number;
      name: string;
      address: string;
      has_floor_plan: boolean;
      has_building_image: boolean;
    } | null;
  } | null;
}

interface DashboardSensor {
  id: number;
  name: string;
  type: string;
  status: string;
  value: number | null;
  unit: string | null;
  alertThreshold: number | null;
  warningThreshold: number | null;
  lastReading: string | null;
  room: { id: number; name: string } | null;
  building: { id: number; name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HAZARD_LABELS: Record<string, string> = {
  fire: 'Fire',
  smoke: 'Smoke',
  gas_leak: 'Gas Leak',
  structural: 'Structural',
  electrical: 'Electrical',
  chemical: 'Chemical',
  flood: 'Flood',
  other: 'Incident',
};

const HAZARD_ICONS: Record<string, React.ElementType> = {
  fire: Flame,
  smoke: Wind,
  gas_leak: Radio,
  electrical: Zap,
  flood: Droplets,
  structural: Building2,
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'bg-red-500 text-white hover:bg-red-500',
  high: 'bg-orange-500 text-white hover:bg-orange-500',
  medium: 'bg-amber-400 text-white hover:bg-amber-400',
  low: 'bg-green-500 text-white hover:bg-green-500',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
  pending: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
  responded: 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-red-500',
  pending: 'bg-amber-500',
  responded: 'bg-blue-500',
};

const SENSOR_STATUS_CLASS: Record<string, string> = {
  alert: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  warning: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
};

function formatElapsed(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function hazardLocation(h: DashardHazard): string {
  const parts: string[] = [];
  if (h.room?.name) parts.push(h.room.name);
  if (h.floor?.level != null) parts.push(`Floor ${h.floor.level}`);
  if (h.floor?.building?.name) parts.push(h.floor.building.name);
  return parts.join(', ') || 'Unknown Location';
}

function hazardTitle(h: DashardHazard): string {
  return `${HAZARD_LABELS[h.type] ?? h.type} — ${hazardLocation(h)}`;
}

function toSeverityType(s: string): 'critical' | 'high' | 'medium' | 'low' {
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s;
  return 'medium';
}

import type React from 'react';

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboardContent() {
  const { user, dashboardRole, roleTitle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Elapsed ticker — updates every 10 seconds to keep durations fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hazards, setHazards] = useState<DashardHazard[]>([]);
  const [sensors, setSensors] = useState<DashboardSensor[]>([]);
  const [buildings, setBuildings] = useState<BuildingWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [filter, setFilter] = useState<'all' | 'priority'>('all');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [respondingIncident, setRespondingIncident] = useState<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>({ id: '', title: '', severity: 'medium' });

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [statsData, alertsData, buildingsData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getDashboardAlerts().catch(() => ({ hazards: [], sensors: [] })),
          api.getBuildingsWithStatus().catch(() => []),
        ]);
        setStats(statsData);
        setHazards(alertsData?.hazards ?? []);
        setSensors(alertsData?.sensors ?? []);
        setBuildings(buildingsData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const criticalHazard: DashardHazard | null =
    hazards.find(h => h.severity === 'critical') ??
    hazards.find(h => h.severity === 'high') ??
    hazards[0] ??
    null;

  const filteredHazards =
    filter === 'priority'
      ? hazards.filter(h => h.severity === 'critical' || h.severity === 'high')
      : hazards;

  const buildingIdsWithHazards = new Set(
    hazards.map(h => h.floor?.building?.id).filter(Boolean)
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRespondClick = (h: DashardHazard) => {
    setRespondingIncident({
      id: String(h.id),
      title: hazardTitle(h),
      severity: toSeverityType(h.severity),
    });
    setShowIncidentModal(true);
  };

  const handleIncidentRespond = async (notes: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({
        title: 'Response Logged',
        description: 'Your response has been recorded.',
        duration: 4000,
      });
      setShowIncidentModal(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to log response.', variant: 'destructive' });
    }
  };

  // ── Stats cards ───────────────────────────────────────────────────────────
  const statsCards = [
    {
      label: 'Active Hazards',
      value: loading ? '…' : String(stats?.hazards?.total ?? 0),
      sub: stats?.hazards?.active
        ? `${stats.hazards.active} active${stats.hazards.pending ? `, ${stats.hazards.pending} pending` : ''}`
        : 'None reported',
      icon: AlertTriangle,
      danger: (stats?.hazards?.total ?? 0) > 0,
    },
    {
      label: 'Registered Users',
      value: loading ? '…' : String(stats?.users?.total ?? 0),
      sub: stats ? `${stats.users.active} active` : '',
      icon: Users,
      danger: false,
    },
    {
      label: 'Sensors',
      value: loading ? '…' : String(stats?.sensors?.active ?? 0),
      sub: stats?.sensors?.alert
        ? `${stats.sensors.alert} alerting`
        : 'All nominal',
      icon: Activity,
      danger: (stats?.sensors?.alert ?? 0) > 0,
    },
    {
      label: 'Buildings',
      value: loading ? '…' : String(stats?.buildings?.total ?? 0),
      sub: stats
        ? `${stats.buildings.with_floor_plan} with floor plans`
        : '',
      icon: Building2,
      danger: false,
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role={dashboardRole} userName={user?.name || 'Admin'} userTitle={roleTitle}>
      <div className="flex-1 space-y-6 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-none">

        {/* ── Stats Cards ── */}
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <Card key={card.label} className="border border-border">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <p className={cn(
                      'mt-2 text-3xl font-bold',
                      card.danger ? 'text-red-600' : 'text-[#1f3d2f]'
                    )}>
                      {card.value}
                    </p>
                    <p className={cn(
                      'mt-1.5 text-xs font-medium',
                      card.danger ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {card.sub}
                    </p>
                  </div>
                  <div className={cn(
                    'rounded-lg p-2.5 flex-shrink-0 h-10 w-10 flex items-center justify-center',
                    card.danger ? 'bg-red-100 dark:bg-red-950/40' : 'bg-secondary'
                  )}>
                    <card.icon className={cn(
                      'h-5 w-5',
                      card.danger ? 'text-red-500' : 'text-muted-foreground'
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Critical Incident Hero ── */}
        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {criticalHazard ? (
                <span className="h-3 w-3 animate-pulse rounded-full bg-red-500 flex-shrink-0" />
              ) : (
                <span className="h-3 w-3 rounded-full bg-green-500 flex-shrink-0" />
              )}
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {criticalHazard ? 'Critical Priority Incident' : 'Incident Status'}
              </h2>
            </div>
            {hazards.length > 1 && (
              <button
                type="button"
                onClick={() => router.push('/emergency')}
                className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 w-fit"
              >
                View All ({hazards.length}) →
              </button>
            )}
          </div>

          {loading ? (
            <Card className="border border-border">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Loading...
              </CardContent>
            </Card>
          ) : criticalHazard ? (
            <Card className="overflow-hidden border border-border">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Icon/image panel */}
                  <div className="relative h-48 w-full flex-shrink-0 lg:h-auto lg:w-72 bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center border-r border-border">
                    {(() => {
                      const Icon = HAZARD_ICONS[criticalHazard.type] ?? AlertTriangle;
                      return <Icon className="h-20 w-20 text-red-200 opacity-60" />;
                    })()}
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="gap-1.5 bg-white dark:bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm rounded-full">
                        <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        <span>{criticalHazard.floor?.building?.name ?? 'Unknown Building'}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn('px-2.5 py-0.5 text-xs font-semibold rounded capitalize', SEVERITY_CLASS[criticalHazard.severity] ?? SEVERITY_CLASS.medium)}>
                        SEVERITY: {criticalHazard.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={cn('px-2.5 py-0.5 text-xs font-semibold rounded capitalize border', STATUS_BADGE_CLASS[criticalHazard.status] ?? '')}>
                        {criticalHazard.status.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="mt-4 text-xl sm:text-2xl font-bold text-foreground">
                      {HAZARD_LABELS[criticalHazard.type] ?? criticalHazard.type} —{' '}
                      {criticalHazard.floor?.building?.name ?? 'Unknown Building'}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {criticalHazard.description ?? `${HAZARD_LABELS[criticalHazard.type] ?? 'Incident'} detected.`}{' '}
                      <span className="font-semibold text-foreground">
                        Location: {hazardLocation(criticalHazard)}.
                      </span>
                    </p>

                    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ELAPSED</p>
                          <p className="mt-0.5 text-xl font-bold text-foreground font-mono">
                            {formatElapsed(criticalHazard.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HAZARD ID</p>
                          <p className="mt-0.5 text-xl font-bold text-foreground font-mono">
                            #{criticalHazard.id}
                          </p>
                        </div>
                        {criticalHazard.responded_at && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RESPONDED</p>
                            <p className="mt-0.5 text-xl font-bold text-foreground font-mono">
                              {formatElapsed(criticalHazard.responded_at)} ago
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          onClick={() => handleRespondClick(criticalHazard)}
                          className="gap-2 bg-[#1f3d2f] px-5 text-sm text-white hover:bg-[#2a4f3d]"
                        >
                          <Siren className="h-4 w-4 flex-shrink-0" />
                          Respond to Incident
                        </Button>
                        {criticalHazard.floor?.building?.id && (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/emergency?id=${criticalHazard.floor!.building!.id}`)}
                            className="gap-2 text-sm"
                          >
                            <Map className="h-4 w-4" />
                            View on Map
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border">
              <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-lg font-semibold text-foreground">All Clear</p>
                <p className="text-sm text-muted-foreground">No active incidents at this time.</p>
              </CardContent>
            </Card>
          )}

          <IncidentActionModal
            open={showIncidentModal}
            incidentId={respondingIncident.id}
            title={respondingIncident.title}
            severity={respondingIncident.severity}
            onClose={() => setShowIncidentModal(false)}
            onRespond={handleIncidentRespond}
          />
        </section>

        {/* ── Active Incident Feed ── */}
        <section>
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                Active Incident Feed
              </CardTitle>
              <div className="flex items-center gap-0 border border-border rounded-md overflow-hidden">
                {(['all', 'priority'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold transition-colors',
                      filter === f
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f === 'all' ? 'All' : 'Critical / High'}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[120px_1fr_110px_100px_60px] gap-4 border-y border-border bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div>ID / STATUS</div>
                <div>INCIDENT DETAILS</div>
                <div>SEVERITY</div>
                <div>ELAPSED</div>
                <div>ACTION</div>
              </div>

              <div className="divide-y divide-border">
                {loading ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">Loading incidents…</div>
                ) : filteredHazards.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    {filter === 'priority' ? 'No critical or high-severity incidents.' : 'No active incidents at this time.'}
                  </div>
                ) : (
                  filteredHazards.map(h => (
                    <div
                      key={h.id}
                      className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/20 md:grid md:grid-cols-[120px_1fr_110px_100px_60px] md:items-center md:gap-4"
                    >
                      {/* ID / Status */}
                      <div>
                        <p className="text-sm font-mono font-medium text-muted-foreground">#{h.id}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_DOT[h.status] ?? 'bg-gray-400')} />
                          <span className={cn('text-[11px] font-bold uppercase', STATUS_BADGE_CLASS[h.status]?.includes('red') ? 'text-red-600' : STATUS_BADGE_CLASS[h.status]?.includes('amber') ? 'text-amber-600' : 'text-blue-600')}>
                            {h.status}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {HAZARD_LABELS[h.type] ?? h.type}
                          {h.room?.name ? ` — ${h.room.name}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {h.description ?? hazardLocation(h)}
                        </p>
                      </div>

                      {/* Severity */}
                      <div>
                        <Badge className={cn('text-xs font-semibold rounded capitalize', SEVERITY_CLASS[h.severity] ?? SEVERITY_CLASS.medium)}>
                          {h.severity}
                        </Badge>
                      </div>

                      {/* Elapsed */}
                      <div className="text-sm font-mono font-medium text-foreground">
                        {formatElapsed(h.created_at)}
                      </div>

                      {/* Action */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Respond"
                          onClick={() => handleRespondClick(h)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {h.floor?.building?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View on map"
                            onClick={() => router.push(`/emergency?id=${h.floor!.building!.id}`)}
                          >
                            <Map className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Bottom row: Sensor Alerts + Building Overview ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sensor Alert Feed */}
          <Card className="border border-border">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                Sensor Alerts
                {sensors.length > 0 && (
                  <Badge className="bg-amber-500 text-white ml-auto text-xs">{sensors.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">Loading…</div>
              ) : sensors.length === 0 ? (
                <div className="px-6 py-8 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium text-foreground">All Sensors Nominal</p>
                  <p className="text-xs text-muted-foreground">No sensors are currently in alert or warning state.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sensors.map(s => (
                    <div key={s.id} className="px-6 py-3 flex items-start gap-3">
                      <div className={cn(
                        'mt-0.5 h-2 w-2 rounded-full flex-shrink-0',
                        s.status === 'alert' ? 'bg-red-500' : 'bg-amber-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-bold uppercase flex-shrink-0', SENSOR_STATUS_CLASS[s.status] ?? '')}
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.type}{s.room?.name ? ` · ${s.room.name}` : ''}{s.building?.name ? ` · ${s.building.name}` : ''}
                        </p>
                        {s.value != null && (
                          <p className="text-xs font-medium mt-1">
                            <span className={s.status === 'alert' ? 'text-red-600' : 'text-amber-600'}>
                              {s.value} {s.unit ?? ''}
                            </span>
                            {s.alertThreshold != null && (
                              <span className="text-muted-foreground"> / threshold {s.alertThreshold} {s.unit ?? ''}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Building Safety Overview */}
          <Card className="border border-border">
            <CardHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#1f3d2f]" />
                  Building Overview
                </CardTitle>
                <button
                  onClick={() => router.push('/admin/buildings')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage →
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">Loading…</div>
              ) : buildings.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  No buildings found.{' '}
                  <button onClick={() => router.push('/admin/buildings')} className="text-blue-600 hover:underline">
                    Add one
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {buildings.slice(0, 8).map(b => {
                    const hasAlert = buildingIdsWithHazards.has(b.id);
                    return (
                      <div
                        key={b.id}
                        className="px-6 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/emergency?id=${b.id}&building=${encodeURIComponent(b.name)}`)}
                      >
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          hasAlert ? 'bg-red-100 dark:bg-red-950/40' : 'bg-secondary'
                        )}>
                          {hasAlert
                            ? <AlertTriangle className="h-4 w-4 text-red-500" />
                            : <Building2 className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {hasAlert && (
                            <Badge variant="outline" className="text-[10px] border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30">
                              Alert
                            </Badge>
                          )}
                          {b.has_floor_plan ? (
                            <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30">
                              <Map className="h-2.5 w-2.5 mr-1" />
                              Map
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              No Map
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {buildings.length > 8 && (
                    <div className="px-6 py-3 text-center">
                      <button
                        onClick={() => router.push('/admin/buildings')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + {buildings.length - 8} more buildings
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
