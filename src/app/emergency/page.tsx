'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  MessageCircle,
  X,
  AlertTriangle,
  Users,
  LayoutDashboard,
  Box,
  Grid3X3,
  Share2,
  Check,
  PersonStanding,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { EmergencyState } from '@/lib/map';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Dynamically import EvacuationMap to avoid SSR issues with MapLibre
const EvacuationMap = dynamic(
  () => import('@/components/maps/EvacuationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tactical map...</p>
        </div>
      </div>
    )
  }
);

// Navigation items for sidebar
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: '3d-map', label: '3D Isometric Map', icon: Box, href: '/emergency', active: true },
  { id: 'grid', label: 'External Grid', icon: Grid3X3, href: '/admin/buildings' },
  { id: 'personnel', label: 'Personnel', icon: Users, href: '/admin/residents' },
];

// Floor data
const floors = ['F09', 'F08', 'F07', 'F06', 'F05'];

// Mock units for unit tracking
const defaultUnits = [
  { id: 'SQ42', name: 'Squad 42', status: 'Entering Floor 07', active: true },
  { id: 'RE02', name: 'Rescue 02', status: 'Staging Floor 05', active: false },
];

export default function EmergencyPage() {
  const { user } = useAuth();

  // UI State
  const [activeFloor, setActiveFloor] = useState('F07');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [stackMode, setStackMode] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // Emergency State
  const [emergencyState, setEmergencyState] = useState<EmergencyState | null>(null);
  const [units, setUnits] = useState(defaultUnits);
  const [criticalAlert, setCriticalAlert] = useState<{
    title: string;
    description: string;
    acknowledged: boolean;
  } | null>(null);

  // AI Messages
  const [aiMessages, setAiMessages] = useState<string[]>([
    "System ready. Monitoring for fire hazards.",
    "All evacuation routes are clear.",
    "Emergency services on standby."
  ]);

  // Handle emergency state changes from map
  const handleEmergencyStateChange = useCallback((state: EmergencyState) => {
    setEmergencyState(state);

    if (state.mode === 'fire_detected') {
      setAiMessages([
        "ALERT: Fire detected in building!",
        `${state.fireMarkers.length} active fire location(s)`,
        "Recommended: Start evacuation immediately",
        "Emergency services have been notified",
        "Avoid elevators - use stairs only"
      ]);
      setIsTalking(true);

      setCriticalAlert({
        title: 'Unit 701: Breach',
        description: 'Thermal escalation in NW quadrant. Recommend pathing via East Stairs (Safety Trail updated).',
        acknowledged: false,
      });

      setUnits([
        { id: 'SQ42', name: 'Squad 42', status: 'Responding to Alert', active: true },
        { id: 'RE02', name: 'Rescue 02', status: 'En Route', active: true },
      ]);
    } else if (state.mode === 'evacuation_in_progress') {
      setAiMessages([
        "EVACUATION IN PROGRESS",
        `${state.occupancy} people remaining in building`,
        `Evacuation ${Math.round(state.evacuationProgress * 100)}% complete`,
        "Follow illuminated exit signs",
        "Assist those who need help"
      ]);

      setUnits([
        { id: 'SQ42', name: 'Squad 42', status: 'Clearing Floor 07', active: true },
        { id: 'RE02', name: 'Rescue 02', status: 'Assisting Evacuation', active: true },
      ]);
    } else if (state.mode === 'evacuation_complete') {
      setAiMessages([
        "EVACUATION COMPLETE",
        "All occupants have been evacuated",
        "Building is now clear",
        "Wait for fire department clearance",
        "Do not re-enter the building"
      ]);
      setIsTalking(false);
      setCriticalAlert(null);

      setUnits([
        { id: 'SQ42', name: 'Squad 42', status: 'Sweep Complete', active: false },
        { id: 'RE02', name: 'Rescue 02', status: 'Standby', active: false },
      ]);
    } else if (state.mode === 'idle') {
      setAiMessages([
        "System ready. Monitoring for fire hazards.",
        "All evacuation routes are clear.",
        "Emergency services on standby."
      ]);
      setIsTalking(false);
      setCriticalAlert(null);
      setUnits(defaultUnits);
    }
  }, []);

  // Handle room click from map
  const handleRoomClick = useCallback((room: GeoJSON.Feature) => {
    const roomName = room.properties?.name || 'Unknown Room';
    const roomType = room.properties?.room_type || 'Unknown';

    setAiMessages(prev => [
      `Selected: ${roomName}`,
      `Room type: ${roomType}`,
      ...prev.slice(0, 3)
    ]);
  }, []);

  // Handle acknowledge alert
  const handleAcknowledgeAlert = () => {
    if (criticalAlert) {
      setCriticalAlert({ ...criticalAlert, acknowledged: true });
    }
  };

  // Get building system status
  const getAirstreamIntegrity = () => {
    if (!emergencyState || emergencyState.mode === 'idle') return 100;
    if (emergencyState.mode === 'fire_detected') return 75;
    if (emergencyState.mode === 'evacuation_in_progress') return 60;
    return 100;
  };

  const getStairwellStatus = () => {
    if (!emergencyState || emergencyState.mode === 'idle') return [true, true, true, true];
    if (emergencyState.mode === 'fire_detected') return [true, false, true, false];
    return [true, true, true, true];
  };

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Left Sidebar */}
      <aside className="flex-shrink-0 w-52 flex flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Flame className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">IGNIS COMMAND</h1>
            <p className="text-[10px] text-muted-foreground">ELITE TACTICAL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3">
          <Button
            variant="destructive"
            className="w-full gap-2 py-4 text-sm font-semibold"
          >
            <AlertTriangle className="h-4 w-4" />
            Evacuation Alert
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">CENTRAL PLAZA COMPLEX</h1>
                <Badge variant="secondary" className="text-[10px] font-semibold">HIGH RISE</Badge>
              </div>
              <p className="text-xs text-muted-foreground">1248 North Ave, Metropolis Sector 4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border bg-secondary p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 h-7 text-xs ${viewMode === '2d' ? 'bg-card shadow-sm' : ''}`}
                onClick={() => setViewMode('2d')}
              >
                2D PLAN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-3 h-7 text-xs ${viewMode === '3d' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}`}
                onClick={() => setViewMode('3d')}
              >
                3D VIEW
              </Button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">{user?.name || 'Cmdr. Sterling'}</p>
                <p className="text-[10px] text-muted-foreground">SENIOR DIRECTOR</p>
              </div>
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'CS'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Floor Selector */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 border-r border-border bg-card px-3 py-4">
            {floors.map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() => setActiveFloor(floor)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  activeFloor === floor
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {floor}
              </button>
            ))}
            <div className="mt-2 flex flex-col items-center gap-1">
              <Switch checked={stackMode} onCheckedChange={setStackMode} />
              <span className="text-[9px] font-medium text-muted-foreground">STACK</span>
            </div>
          </div>

          {/* Map View Area */}
          <div className="relative flex-1 min-w-0">
            {/* Critical Alert Card */}
            <AnimatePresence>
              {criticalAlert && !criticalAlert.acknowledged && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute left-4 top-4 z-20 w-64"
                >
                  <Card className="border-0 bg-gradient-to-br from-red-400 to-red-500 text-white shadow-xl">
                    <CardContent className="p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <Badge className="bg-red-700/50 text-[9px] font-bold text-white hover:bg-red-700/50">CRITICAL ALERT</Badge>
                        <div className="h-2 w-2 rounded-full bg-white/50 animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold">{criticalAlert.title}</h3>
                      <p className="mt-1 text-xs text-white/90">
                        {criticalAlert.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAcknowledgeAlert}
                          className="flex-1 border-white/30 bg-transparent text-white hover:bg-white/20 text-xs h-8"
                        >
                          ACKNOWLEDGE
                        </Button>
                        <Button size="icon" className="bg-red-700 text-white hover:bg-red-800 h-8 w-8">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evacuation Map */}
            <EvacuationMap
              className="absolute inset-0"
              showControls={true}
              showLegend={false}
              showEmergencyControls={true}
              onRoomClick={handleRoomClick}
              onEmergencyStateChange={handleEmergencyStateChange}
            />

            {/* Tactical Overlay Legend */}
            <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg">
              <CardContent className="flex items-center gap-4 px-4 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tactical Overlay</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="text-xs text-foreground">Smoke Zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" className="text-muted-foreground" /></svg>
                  <span className="text-xs text-foreground">Safety Path</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-3 w-3 items-center justify-center rounded bg-green-500">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-xs text-foreground">Exit</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Command Intelligence */}
          <div className="flex-shrink-0 w-64 border-l border-border bg-card p-4 overflow-y-auto">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">Command Intelligence</h2>

            {/* Airstream Integrity */}
            <div className="mb-4 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Airstream Integrity</span>
                <span className="text-xs font-semibold text-foreground">
                  {getAirstreamIntegrity() > 80 ? 'Positive' : 'Compromised'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${getAirstreamIntegrity()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Stairwell Pressurization */}
            <div className="mb-4 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stairwell Pressurization</span>
                <span className="text-xs font-semibold text-foreground">Active</span>
              </div>
              <div className="mt-2 flex gap-1">
                {getStairwellStatus().map((active, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full ${active ? 'bg-green-500' : 'bg-secondary'}`}
                  />
                ))}
              </div>
            </div>

            {/* Unit Tracking */}
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground">Unit Tracking</h3>
            <div className="space-y-2">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className={`flex items-center justify-between rounded-lg p-2 ${
                    unit.active ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold ${
                      unit.active ? 'bg-primary-foreground/20' : 'bg-card'
                    }`}>
                      {unit.id}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${unit.active ? 'text-primary-foreground' : 'text-foreground'}`}>{unit.name}</p>
                      <p className={`text-[10px] ${unit.active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{unit.status}</p>
                    </div>
                  </div>
                  {unit.active && <PersonStanding className="h-4 w-4 text-primary-foreground/70" />}
                </div>
              ))}
            </div>

            {/* Elite Protocol */}
            <Card className="mt-4 border-0 bg-primary text-primary-foreground">
              <CardContent className="p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Elite Protocol</span>
                </div>
                <p className="text-[11px] italic text-primary-foreground/80">
                  "Tactical awareness is superiority. The 3D view ensures no vertical spread goes unnoticed."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Agent Button */}
      <motion.button
        type="button"
        onClick={() => setIsAIOpen(!isAIOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-2xl flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isAIOpen ? <X className="w-6 h-6 text-primary-foreground" /> : <MessageCircle className="w-6 h-6 text-primary-foreground" />}
        {isTalking && (
          <motion.div
            className="absolute inset-0 border-4 border-primary-foreground rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>

      {/* AI Chat Window */}
      <AnimatePresence>
        {isAIOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 bg-card rounded-2xl shadow-2xl z-50 overflow-hidden border border-border"
          >
            <div className={`${emergencyState?.mode === 'fire_detected' ? 'bg-destructive' : 'bg-primary'} text-primary-foreground p-4`}>
              <h3 className="font-bold text-sm">Emergency AI Assistant</h3>
              <p className="text-xs opacity-90">
                {emergencyState?.mode === 'fire_detected' ? 'Emergency Mode Active' : 'Real-time guidance'}
              </p>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {aiMessages.map((msg, idx) => (
                <motion.div
                  key={`${idx}-${msg}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-3 rounded-lg text-sm ${
                    emergencyState?.mode === 'fire_detected' && idx === 0
                      ? 'bg-destructive/10 text-destructive font-semibold'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
