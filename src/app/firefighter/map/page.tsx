'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/components/map';
import { Navigation, Plus, Layers, Flame, Map } from 'lucide-react';

// Dynamically import the map to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import('@/components/map/LiveMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
        </div>
    )
});

// Incident data - in a real app, this would come from your database
const incidents = [
    {
        id: 'INC-001',
        title: 'Warehouse Fire - Pier 15',
        location: '88 Harbor Road',
        priority: 1,
        status: 'active',
        units: 4,
        elapsed: '12m',
        lat: 24.8650,
        lng: 67.0080,
        temp: '450°C',
        wind: '12km/h',
    },
    {
        id: 'INC-002',
        title: 'Brush Fire - North Trail',
        location: 'North Trail Park',
        priority: 2,
        status: 'active',
        units: 2,
        elapsed: '45m',
        lat: 24.8700,
        lng: 67.0150,
        temp: '280°C',
        wind: '8km/h',
    },
    {
        id: 'INC-003',
        title: 'Structure Check - 5th Ave',
        location: '505 5th Avenue',
        priority: 3,
        status: 'en_route',
        units: 1,
        elapsed: '3m',
        lat: 24.8580,
        lng: 66.9950,
    },
    {
        id: 'INC-004',
        title: 'Gas Leak Report',
        location: '123 Garden Avenue',
        priority: 2,
        status: 'monitoring',
        units: 1,
        elapsed: '28m',
        lat: 24.8607,
        lng: 67.0011,
    },
];

// Convert incidents to map markers
const incidentMarkers: MapMarker[] = incidents.map(incident => ({
    id: incident.id,
    lat: incident.lat,
    lng: incident.lng,
    title: incident.title,
    description: `${incident.location} • ${incident.units} Unit${incident.units > 1 ? 's' : ''} • ${incident.elapsed}`,
    type: 'incident',
    color: incident.priority === 1 ? '#dc2626' : incident.priority === 2 ? '#f59e0b' : '#3b82f6',
}));

// Fire stations
const fireStationMarkers: MapMarker[] = [
    { id: 'fs1', lat: 24.8550, lng: 67.0100, title: 'Fire Station #7', description: 'Central District • 12 Personnel', type: 'fire_station' },
    { id: 'fs2', lat: 24.8720, lng: 66.9980, title: 'Fire Station #3', description: 'North District • 8 Personnel', type: 'fire_station' },
];

// Sensor markers
const sensorMarkers: MapMarker[] = [
    { id: 's1', lat: 24.8620, lng: 67.0030, title: 'Smoke Sensor #12', description: 'Status: Active', type: 'sensor' },
    { id: 's2', lat: 24.8640, lng: 67.0060, title: 'Heat Sensor #8', description: 'Status: Active', type: 'sensor' },
    { id: 's3', lat: 24.8570, lng: 67.0020, title: 'CO Sensor #15', description: 'Status: Active', type: 'sensor' },
    { id: 's4', lat: 24.8660, lng: 67.0000, title: 'Smoke Sensor #22', description: 'Status: Warning', type: 'sensor', color: '#f59e0b' },
];

const allMarkers = [...incidentMarkers, ...fireStationMarkers, ...sensorMarkers];

function MapViewContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

    const handleMarkerClick = useCallback((marker: MapMarker) => {
        setSelectedMarker(marker);
        if (marker.type === 'incident') {
            setSelectedIncident(marker.id);
        }
    }, []);

    const handleIncidentClick = (incidentId: string) => {
        setSelectedIncident(incidentId);
        const marker = incidentMarkers.find(m => m.id === incidentId);
        if (marker) setSelectedMarker(marker);
    };

    const openFloorPlan = (incidentId: string) => {
        const incident = incidents.find(i => i.id === incidentId);
        if (incident) {
            // Navigate to emergency page with incident info
            router.push(`/emergency?id=${incident.id}&building=${encodeURIComponent(incident.title)}`);
        }
    };

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900';
            case 2: return 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900';
            default: return 'border-border bg-card hover:bg-muted/50';
        }
    };

    const getPriorityBadge = (priority: number) => {
        switch (priority) {
            case 1: return <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Priority 1</span>;
            case 2: return <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Priority 2</span>;
            default: return <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Priority 3</span>;
        }
    };

    return (
        <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR" disablePadding={true}>
            <div className="relative w-full h-full overflow-hidden min-h-[calc(100vh-64px)]">
                {/* Real Map */}
                <LiveMap
                    markers={allMarkers}
                    showCurrentLocation={true}
                    onMarkerClick={handleMarkerClick}
                    height="100%"
                    className="absolute inset-0"
                />

                {/* Floating Left Sidebar (Incident List) */}
                <aside className="absolute left-4 top-4 bottom-4 w-72 lg:w-80 z-[1000] flex flex-col gap-3 pointer-events-none">
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl pointer-events-auto overflow-hidden flex flex-col flex-1 max-h-[calc(100%-60px)]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-[#1f3d2f] text-white">
                            <h3 className="font-bold text-sm tracking-wide uppercase">Active Incidents</h3>
                            <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{incidents.length} ALERT</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {incidents.map((incident) => (
                                <div
                                    key={incident.id}
                                    onClick={() => handleIncidentClick(incident.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${getPriorityColor(incident.priority)} ${selectedIncident === incident.id ? 'ring-2 ring-[#1f3d2f]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        {getPriorityBadge(incident.priority)}
                                        <span className="text-[10px] text-muted-foreground font-mono">#{incident.id}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-foreground leading-tight">{incident.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{incident.units} Unit{incident.units > 1 ? 's' : ''} Assigned • {incident.elapsed} elapsed</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {incident.status === 'active' && (
                                            <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                                                Active
                                            </span>
                                        )}
                                        {incident.status === 'en_route' && (
                                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                                En Route
                                            </span>
                                        )}
                                        {incident.status === 'monitoring' && (
                                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                                Monitoring
                                            </span>
                                        )}
                                        {incident.temp && (
                                            <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                                                {incident.temp}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openFloorPlan(incident.id);
                                        }}
                                        className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-md text-[10px] font-semibold transition-colors"
                                    >
                                        <Map className="h-3 w-3" />
                                        View Floor Plan
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-muted/30 border-t border-border">
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                                <Plus className="h-4 w-4" />
                                New Dispatch
                            </button>
                        </div>
                    </div>
                    {/* Sensor Summary Stats */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg pointer-events-auto p-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400">
                                <Navigation className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Sensor Network</p>
                                <p className="text-xs font-bold text-foreground">124 Nodes Online <span className="text-green-500 ml-1">●</span></p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Bottom Right Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-[1000]">
                    {/* Quick Stats */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl overflow-hidden p-3 pointer-events-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Stats</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Active Incidents</span>
                                <span className="font-bold text-red-600">{incidents.filter(i => i.status === 'active').length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Units Deployed</span>
                                <span className="font-bold text-foreground">{incidents.reduce((sum, i) => sum + i.units, 0)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Fire Stations</span>
                                <span className="font-bold text-foreground">{fireStationMarkers.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl overflow-hidden p-3 pointer-events-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Legend</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-red-500 rounded-full"></div>
                                <span className="text-muted-foreground">Priority 1</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-amber-500 rounded-full"></div>
                                <span className="text-muted-foreground">Priority 2</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-blue-500 rounded-full"></div>
                                <span className="text-muted-foreground">Priority 3</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-orange-500 rounded-full"></div>
                                <span className="text-muted-foreground">Fire Station</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-muted-foreground">Your Location</span>
                            </div>
                        </div>
                    </div>

                    {/* Layers Toggle */}
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl hover:bg-muted transition-colors pointer-events-auto">
                        <Layers className="h-4 w-4 text-foreground" />
                        <span className="text-sm font-semibold">Layers</span>
                    </button>
                </div>

                {/* Selected Marker Info */}
                {selectedMarker && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl p-4 z-[1000] min-w-[280px] pointer-events-auto">
                        <button
                            onClick={() => {
                                setSelectedMarker(null);
                                setSelectedIncident(null);
                            }}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg"
                        >
                            ×
                        </button>
                        <div className="flex items-start gap-3">
                            <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <Flame className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground">{selectedMarker.title}</h4>
                                {selectedMarker.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{selectedMarker.description}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                                    Type: {selectedMarker.type.replace('_', ' ')}
                                </p>
                                {selectedMarker.type === 'incident' && (
                                    <button
                                        onClick={() => openFloorPlan(selectedMarker.id)}
                                        className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-md text-xs font-semibold transition-colors"
                                    >
                                        <Map className="h-3 w-3" />
                                        View Floor Plan
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}

export default function MapView() {
    return (
        <ProtectedRoute allowedRoles={['firefighter']}>
            <MapViewContent />
        </ProtectedRoute>
    );
}
