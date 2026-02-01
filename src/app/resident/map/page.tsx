'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/components/map';
import { Navigation, AlertTriangle, Phone, Building2, Map, Shield } from 'lucide-react';

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

interface ApartmentInfo {
    id: number;
    number: string;
    floor: {
        id: number;
        name: string;
        level: number;
    };
    building: {
        id: number;
        name: string;
        address: string;
        type: string;
        has_floor_plan?: boolean;
        center_lat?: number;
        center_lng?: number;
    };
    status: string;
    occupied: boolean;
}

function ResidentMapContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [apartmentInfo, setApartmentInfo] = useState<ApartmentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeAlerts, setActiveAlerts] = useState(0);

    // Fetch apartment data
    useEffect(() => {
        const fetchApartmentData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apartments/my-apartment`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const transformedData: ApartmentInfo = {
                        id: data.id,
                        number: data.unit_number,
                        floor: {
                            id: data.floor?.id || 1,
                            name: data.floor?.name || `Floor ${data.floor?.level || 1}`,
                            level: data.floor?.level || 1,
                        },
                        building: {
                            id: data.floor?.building?.id || data.building?.id || 1,
                            name: data.floor?.building?.name || data.building?.name || 'My Building',
                            address: data.floor?.building?.address || data.building?.address || 'Address',
                            type: data.floor?.building?.type || data.building?.type || 'residential',
                            has_floor_plan: data.floor?.building?.has_floor_plan || data.building?.has_floor_plan || false,
                            center_lat: data.floor?.building?.center_lat || data.building?.center_lat,
                            center_lng: data.floor?.building?.center_lng || data.building?.center_lng,
                        },
                        status: data.occupied ? 'Occupied' : 'Vacant',
                        occupied: data.occupied,
                    };
                    setApartmentInfo(transformedData);
                }

                // Fetch active hazards count for the building
                try {
                    const hazardsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hazards/active`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const hazards = await hazardsResponse.json();
                    setActiveAlerts(Array.isArray(hazards) ? hazards.length : 0);
                } catch (err) {
                    console.warn('Could not fetch hazards:', err);
                }
            } catch (error) {
                console.error('Failed to fetch apartment data:', error);
                // Set fallback data
                setApartmentInfo({
                    id: 101,
                    number: "402-B",
                    floor: { id: 4, name: "4th Floor", level: 4 },
                    building: {
                        id: 1,
                        name: "Skyline Heights",
                        address: "124 Marina Blvd",
                        type: "Residential",
                        has_floor_plan: true,
                    },
                    status: "Occupied",
                    occupied: true
                });
            } finally {
                setLoading(false);
            }
        };

        fetchApartmentData();
    }, []);

    // Generate markers based on apartment data
    const getMarkers = (): MapMarker[] => {
        const markers: MapMarker[] = [];

        if (apartmentInfo) {
            // Building marker
            const lat = apartmentInfo.building.center_lat || 24.8607;
            const lng = apartmentInfo.building.center_lng || 67.0011;

            markers.push({
                id: String(apartmentInfo.building.id),
                lat: lat,
                lng: lng,
                title: apartmentInfo.building.name,
                description: `${apartmentInfo.building.address} - Your Building`,
                type: 'building',
                color: '#22c55e',
            });

            // Fire station marker (nearby)
            markers.push({
                id: 'fs1',
                lat: lat + 0.005,
                lng: lng - 0.005,
                title: 'Fire Station #7',
                description: 'Response time: ~5 min',
                type: 'fire_station',
            });

            // Assembly point
            markers.push({
                id: 'ap1',
                lat: lat - 0.002,
                lng: lng + 0.003,
                title: 'Assembly Point A',
                description: 'Main Gate - Capacity: 500',
                type: 'assembly_point',
            });
        }

        return markers;
    };

    const handleMarkerClick = useCallback((marker: MapMarker) => {
        setSelectedMarker(marker);
    }, []);

    const openFloorPlan = () => {
        if (apartmentInfo) {
            router.push(`/emergency?id=${apartmentInfo.building.id}&building=${encodeURIComponent(apartmentInfo.building.name)}`);
        }
    };

    const markers = getMarkers();

    return (
        <DashboardLayout role="resident" userName={user?.name || 'Resident'} userTitle="RESIDENT" disablePadding={true}>
            <div className="relative w-full h-full overflow-hidden min-h-[calc(100vh-64px)]">
                {/* Real Map */}
                <LiveMap
                    markers={markers}
                    showCurrentLocation={true}
                    onMarkerClick={handleMarkerClick}
                    height="100%"
                    className="absolute inset-0"
                />

                {/* Floating Left Sidebar (Building Info & Alerts) */}
                <aside className="absolute left-4 top-4 bottom-4 w-72 lg:w-80 z-[1000] flex flex-col gap-3 pointer-events-none">
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl pointer-events-auto overflow-hidden flex flex-col flex-1 max-h-[calc(100%-60px)]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-[#1f3d2f] text-white">
                            <h3 className="font-bold text-sm tracking-wide uppercase">My Building</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeAlerts > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                                {activeAlerts > 0 ? `${activeAlerts} ALERT${activeAlerts > 1 ? 'S' : ''}` : 'SAFE'}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1f3d2f]"></div>
                                </div>
                            ) : apartmentInfo ? (
                                <>
                                    {/* Building Info Card */}
                                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-start gap-3">
                                            <div className="size-10 rounded-lg bg-[#1f3d2f]/10 flex items-center justify-center text-[#1f3d2f]">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-foreground leading-tight">{apartmentInfo.building.name}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{apartmentInfo.building.address}</p>
                                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>{apartmentInfo.floor.name}</span>
                                                    <span>Unit {apartmentInfo.number}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {apartmentInfo.building.has_floor_plan && (
                                            <button
                                                onClick={openFloorPlan}
                                                className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-md text-[10px] font-semibold transition-colors"
                                            >
                                                <Map className="h-3 w-3" />
                                                View Building Map
                                            </button>
                                        )}
                                    </div>

                                    {/* Safety Status */}
                                    <div className={`p-3 rounded-lg border ${activeAlerts > 0 ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900' : 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {activeAlerts > 0 ? 'Alert Active' : 'All Clear'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">Now</span>
                                        </div>
                                        <h4 className="font-bold text-sm text-foreground leading-tight">
                                            {activeAlerts > 0 ? `${activeAlerts} Active Alert${activeAlerts > 1 ? 's' : ''}` : 'No Active Alerts'}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activeAlerts > 0 ? 'Please check emergency instructions' : 'All systems operational'}
                                        </p>
                                    </div>

                                    {/* Emergency Contacts */}
                                    <div className="p-3 rounded-lg border border-border bg-card">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Emergency Contacts</p>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Building Security</span>
                                                <a href="tel:+923001234567" className="font-mono text-foreground hover:text-[#1f3d2f] flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    +92-300-1234567
                                                </a>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Fire Department</span>
                                                <a href="tel:16" className="font-mono text-foreground hover:text-[#1f3d2f] flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    16
                                                </a>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Building Manager</span>
                                                <a href="tel:+923219876543" className="font-mono text-foreground hover:text-[#1f3d2f] flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    +92-321-9876543
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No apartment information found.
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900">
                            <button
                                onClick={() => router.push('/emergency')}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                <AlertTriangle className="h-4 w-4" />
                                Report Emergency
                            </button>
                        </div>
                    </div>
                    {/* Sensor Summary Stats */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg pointer-events-auto p-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Building Safety</p>
                                <p className="text-xs font-bold text-foreground">All Systems Online <span className="text-green-500 ml-1">.</span></p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Bottom Right Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-[1000]">
                    {/* Legend */}
                    <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl overflow-hidden p-3 pointer-events-auto">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Legend</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-muted-foreground">Your Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Your Building</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-orange-500 rounded-full"></div>
                                <span className="text-muted-foreground">Fire Station</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-blue-500 rounded-full"></div>
                                <span className="text-muted-foreground">Assembly Point</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Marker Info */}
                {selectedMarker && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-xl p-4 z-[1000] min-w-[250px] pointer-events-auto">
                        <button
                            onClick={() => setSelectedMarker(null)}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        >
                            x
                        </button>
                        <h4 className="font-bold text-sm text-foreground">{selectedMarker.title}</h4>
                        {selectedMarker.description && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedMarker.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                            Type: {selectedMarker.type.replace('_', ' ')}
                        </p>
                        {selectedMarker.type === 'building' && apartmentInfo?.building.has_floor_plan && (
                            <button
                                onClick={openFloorPlan}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1f3d2f] hover:bg-[#2a5040] text-white rounded-md text-xs font-semibold transition-colors"
                            >
                                <Map className="h-3 w-3" />
                                View Building Map
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function ResidentMapPage() {
    return (
        <ProtectedRoute allowedRoles={['resident']}>
            <ResidentMapContent />
        </ProtectedRoute>
    );
}
