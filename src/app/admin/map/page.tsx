'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/components/map';
import { Building2, Navigation, Plus, Layers, Map } from 'lucide-react';

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

// Building data - in a real app, this would come from your database
const buildings = [
    {
        id: 'B-001',
        name: 'Oakwood Lofts',
        address: '88 Forest Ave',
        status: 'alert',
        statusText: 'Smoke detected Floor 3',
        alerts: 2,
        units: 120,
        lat: 24.8650,
        lng: 67.0080,
    },
    {
        id: 'B-002',
        name: 'Green Heights Residency',
        address: '123 Garden Avenue',
        status: 'normal',
        statusText: 'All systems normal',
        alerts: 0,
        units: 180,
        lat: 24.8607,
        lng: 67.0011,
    },
    {
        id: 'B-003',
        name: 'Harbor Plaza',
        address: '22 Port St',
        status: 'warning',
        statusText: 'Sensor maintenance due',
        alerts: 0,
        units: 220,
        lat: 24.8550,
        lng: 67.0100,
    },
    {
        id: 'B-004',
        name: 'The Meridian',
        address: '404 Skyline Dr',
        status: 'normal',
        statusText: 'All systems normal',
        alerts: 0,
        units: 320,
        lat: 24.8700,
        lng: 67.0150,
    },
    {
        id: 'B-005',
        name: 'Emerald Towers',
        address: '71 Central Ave',
        status: 'normal',
        statusText: 'All systems normal',
        alerts: 0,
        units: 280,
        lat: 24.8580,
        lng: 66.9950,
    },
];

// Convert buildings to map markers
const buildingMarkers: MapMarker[] = buildings.map(building => ({
    id: building.id,
    lat: building.lat,
    lng: building.lng,
    title: building.name,
    description: `${building.address} • ${building.units} Units`,
    type: 'building',
    color: building.status === 'alert' ? '#dc2626' : building.status === 'warning' ? '#f59e0b' : '#22c55e',
}));

// Add sensor markers
const sensorMarkers: MapMarker[] = [
    { id: 's1', lat: 24.8620, lng: 67.0030, title: 'Smoke Sensor #12', description: 'Status: Active', type: 'sensor' },
    { id: 's2', lat: 24.8640, lng: 67.0060, title: 'Heat Sensor #8', description: 'Status: Active', type: 'sensor' },
    { id: 's3', lat: 24.8570, lng: 67.0020, title: 'CO Sensor #15', description: 'Status: Active', type: 'sensor' },
    { id: 's4', lat: 24.8660, lng: 67.0000, title: 'Smoke Sensor #22', description: 'Status: Warning', type: 'sensor', color: '#f59e0b' },
];

const allMarkers = [...buildingMarkers, ...sensorMarkers];

function AdminMapContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

    const handleMarkerClick = useCallback((marker: MapMarker) => {
        setSelectedMarker(marker);
        if (marker.type === 'building') {
            setSelectedBuilding(marker.id);
        }
    }, []);

    const handleBuildingClick = (buildingId: string) => {
        setSelectedBuilding(buildingId);
        const building = buildings.find(b => b.id === buildingId);
        if (building) {
            const marker = buildingMarkers.find(m => m.id === buildingId);
            if (marker) setSelectedMarker(marker);
        }
    };

    const openFloorPlan = (buildingId: string) => {
        const building = buildings.find(b => b.id === buildingId);
        if (building) {
            // Navigate to emergency page with building info
            router.push(`/emergency?id=${building.id}&building=${encodeURIComponent(building.name)}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'alert': return 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900';
            case 'warning': return 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900';
            default: return 'border-border bg-card hover:bg-muted/50';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'alert': return <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Alert</span>;
            case 'warning': return <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Warning</span>;
            default: return <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Normal</span>;
        }
    };

    return (
        <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR" disablePadding={true}>
            <div className="relative w-full h-full overflow-hidden min-h-[calc(100vh-64px)]">
                {/* Real Map */}
                <LiveMap
                    markers={allMarkers}
                    showCurrentLocation={true}
                    onMarkerClick={handleMarkerClick}
                    height="100%"
                    className="absolute inset-0"
                />

                {/* Floating Left Sidebar (Managed Buildings) */}
                <aside className="absolute left-4 top-4 bottom-4 w-72 lg:w-80 z-[1000] flex flex-col gap-3 pointer-events-none">
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl pointer-events-auto overflow-hidden flex flex-col flex-1 max-h-[calc(100%-60px)]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-[#1f3d2f] text-white">
                            <h3 className="font-bold text-sm tracking-wide uppercase">Managed Buildings</h3>
                            <span className="bg-blue-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{buildings.length} TOTAL</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {buildings.map((building) => (
                                <div
                                    key={building.id}
                                    onClick={() => handleBuildingClick(building.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${getStatusColor(building.status)} ${selectedBuilding === building.id ? 'ring-2 ring-[#1f3d2f]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        {getStatusBadge(building.status)}
                                        <span className="text-[10px] text-muted-foreground font-mono">#{building.id}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-foreground leading-tight">{building.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">{building.address} • {building.statusText}</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {building.alerts > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                                                {building.alerts} Alert{building.alerts > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {building.status === 'warning' && (
                                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                                1 Warning
                                            </span>
                                        )}
                                        {building.status === 'normal' && (
                                            <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                                Secure
                                            </span>
                                        )}
                                        <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                                            {building.units} Units
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openFloorPlan(building.id);
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
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-lg text-xs font-bold transition-colors">
                                <Plus className="h-4 w-4" />
                                Add Building
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
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Sensors</p>
                                <p className="text-xs font-bold text-foreground">248 Nodes Online <span className="text-green-500 ml-1">●</span></p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Bottom Right Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-[1000]">
                    {/* Stats Card */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl overflow-hidden p-3 pointer-events-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Stats</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Total Buildings</span>
                                <span className="font-bold text-foreground">{buildings.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Total Residents</span>
                                <span className="font-bold text-foreground">{buildings.reduce((sum, b) => sum + b.units, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Active Alerts</span>
                                <span className="font-bold text-red-600">{buildings.reduce((sum, b) => sum + b.alerts, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl overflow-hidden p-3 pointer-events-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Legend</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Normal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-amber-500 rounded-full"></div>
                                <span className="text-muted-foreground">Warning</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-red-500 rounded-full"></div>
                                <span className="text-muted-foreground">Alert</span>
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
                                setSelectedBuilding(null);
                            }}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg"
                        >
                            ×
                        </button>
                        <div className="flex items-start gap-3">
                            <div className="size-10 rounded-lg bg-[#1f3d2f]/10 flex items-center justify-center text-[#1f3d2f]">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground">{selectedMarker.title}</h4>
                                {selectedMarker.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{selectedMarker.description}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                                    Type: {selectedMarker.type.replace('_', ' ')}
                                </p>
                                {selectedMarker.type === 'building' && (
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

export default function AdminMapPage() {
    return (
        <ProtectedRoute allowedRoles={['management', 'building_authority']}>
            <AdminMapContent />
        </ProtectedRoute>
    );
}
