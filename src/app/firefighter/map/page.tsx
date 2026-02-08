'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/components/map';
import { Navigation, Plus, Layers, Building2, Map, Shield, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

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

interface BuildingDisplay {
    id: number;
    name: string;
    address: string;
    status: 'normal' | 'warning' | 'alert';
    statusText: string;
    alerts: number;
    units: number;
    lat: number;
    lng: number;
    has_floor_plan: boolean;
    society_name?: string;
    brigade_name?: string;
    state_name?: string;
}

interface JurisdictionInfo {
    level: 'hq' | 'state' | 'district';
    name: string;
    id: number;
}

// Fire stations (can be fetched from API in the future)
const fireStationMarkers: MapMarker[] = [
    { id: 'fs1', lat: 24.8550, lng: 67.0100, title: 'Fire Station #7', description: 'Central District - 12 Personnel', type: 'fire_station' },
    { id: 'fs2', lat: 24.8720, lng: 66.9980, title: 'Fire Station #3', description: 'North District - 8 Personnel', type: 'fire_station' },
];

function FirefighterMapContent() {
    const { user, dashboardRole, roleTitle } = useAuth();
    const router = useRouter();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
    const [buildings, setBuildings] = useState<BuildingDisplay[]>([]);
    const [jurisdiction, setJurisdiction] = useState<JurisdictionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeAlerts, setActiveAlerts] = useState(0);

    // Fetch buildings based on firefighter's jurisdiction
    useEffect(() => {
        const fetchBuildings = async () => {
            if (!user?.id) return;

            try {
                // Fetch buildings by jurisdiction
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/by-jurisdiction/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('ignis_token')}`,
                    },
                });
                const data = await response.json();

                if (data.buildings && Array.isArray(data.buildings)) {
                    // Transform API data to display format
                    const displayBuildings: BuildingDisplay[] = data.buildings.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        address: b.address,
                        status: 'normal' as const,
                        statusText: b.has_floor_plan ? 'Floor plan available' : 'No floor plan',
                        alerts: 0,
                        units: (b.total_floors || 1) * (b.apartments_per_floor || 1),
                        // Use actual coordinates if available, otherwise generate around Karachi
                        lat: b.center_lat || (24.8607 + (Math.random() - 0.5) * 0.02),
                        lng: b.center_lng || (67.0011 + (Math.random() - 0.5) * 0.02),
                        has_floor_plan: b.has_floor_plan || false,
                        society_name: b.society_name,
                        brigade_name: b.brigade_name,
                        state_name: b.state_name,
                    }));
                    setBuildings(displayBuildings);
                    setJurisdiction(data.jurisdiction);
                }

                // Fetch active hazards count
                try {
                    const hazardsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hazards/active`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('ignis_token')}`,
                        },
                    });
                    const hazards = await hazardsResponse.json();
                    setActiveAlerts(Array.isArray(hazards) ? hazards.length : 0);
                } catch (err) {
                    console.warn('Could not fetch hazards:', err);
                }
            } catch (error) {
                console.error('Failed to fetch buildings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBuildings();
    }, [user?.id]);

    // Convert buildings to map markers
    const buildingMarkers: MapMarker[] = buildings.map(building => ({
        id: String(building.id),
        lat: building.lat,
        lng: building.lng,
        title: building.name,
        description: `${building.address} - ${building.units} Units`,
        type: 'building',
        color: building.status === 'alert' ? '#dc2626' : building.status === 'warning' ? '#f59e0b' : '#22c55e',
    }));

    const allMarkers = [...buildingMarkers, ...fireStationMarkers];

    const handleMarkerClick = useCallback((marker: MapMarker) => {
        setSelectedMarker(marker);
        if (marker.type === 'building') {
            setSelectedBuilding(Number(marker.id));
        }
    }, []);

    const handleBuildingClick = (buildingId: number) => {
        setSelectedBuilding(buildingId);
        const building = buildings.find(b => b.id === buildingId);
        if (building) {
            const marker = buildingMarkers.find(m => m.id === String(buildingId));
            if (marker) setSelectedMarker(marker);
        }
    };

    const openFloorPlan = (buildingId: number) => {
        const building = buildings.find(b => b.id === buildingId);
        if (building) {
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

    const getJurisdictionBadge = () => {
        if (!jurisdiction) return null;
        const colors = {
            hq: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            state: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            district: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
        const labels = { hq: 'HQ', state: 'State', district: 'District' };
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colors[jurisdiction.level]}`}>
                {labels[jurisdiction.level]}: {jurisdiction.name}
            </span>
        );
    };

    return (
        <DashboardLayout role={dashboardRole} userName={user?.name || 'Firefighter'} userTitle={roleTitle} disablePadding={true}>
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
                        <div className="p-4 border-b border-border bg-[#1f3d2f] text-white">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-sm tracking-wide uppercase">Jurisdiction Buildings</h3>
                                <span className="bg-blue-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{buildings.length} TOTAL</span>
                            </div>
                            {jurisdiction && (
                                <div className="flex items-center gap-2">
                                    <Shield className="h-3 w-3" />
                                    {getJurisdictionBadge()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1f3d2f]"></div>
                                </div>
                            ) : buildings.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No buildings in your jurisdiction.
                                    {!jurisdiction && <p className="mt-2 text-xs">Your account may not be linked to a fire brigade.</p>}
                                </div>
                            ) : (
                                buildings.map((building) => (
                                    <div
                                        key={building.id}
                                        onClick={() => handleBuildingClick(building.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${getStatusColor(building.status)} ${selectedBuilding === building.id ? 'ring-2 ring-[#1f3d2f]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            {getStatusBadge(building.status)}
                                            <span className="text-[10px] text-muted-foreground font-mono">#B-{String(building.id).padStart(3, '0')}</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-foreground leading-tight">{building.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{building.address}</p>
                                        {building.society_name && (
                                            <p className="text-[10px] text-muted-foreground">{building.society_name}</p>
                                        )}
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {building.alerts > 0 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                                                    {building.alerts} Alert{building.alerts > 1 ? 's' : ''}
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
                                            {building.has_floor_plan && (
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                                    Has Map
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFloorPlan(building.id);
                                            }}
                                            className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-md text-[10px] font-semibold transition-colors"
                                        >
                                            <Map className="h-3 w-3" />
                                            {building.has_floor_plan ? 'View Floor Plan' : 'View Building'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Sensor Summary Stats */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg pointer-events-auto p-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400">
                                <Navigation className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">System Status</p>
                                <p className="text-xs font-bold text-foreground">All Systems Online <span className="text-green-500 ml-1">●</span></p>
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
                                <span className="text-muted-foreground">Buildings</span>
                                <span className="font-bold text-foreground">{buildings.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Total Units</span>
                                <span className="font-bold text-foreground">{buildings.reduce((sum, b) => sum + b.units, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Active Alerts</span>
                                <span className="font-bold text-red-600">{activeAlerts}</span>
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
                                setSelectedBuilding(null);
                            }}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg"
                        >
                            x
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
                                        onClick={() => openFloorPlan(Number(selectedMarker.id))}
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

export default function FirefighterMapPage() {
    return (
        <ProtectedRoute allowedRoles={['firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district', 'admin']}>
            <FirefighterMapContent />
        </ProtectedRoute>
    );
}
