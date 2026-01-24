'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import type { MapMarker } from '@/components/map';
import { Navigation, AlertTriangle, Phone } from 'lucide-react';

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

// Sample markers - in a real app, these would come from your database
const sampleMarkers: MapMarker[] = [
    {
        id: '1',
        lat: 24.8607,
        lng: 67.0011,
        title: 'Green Heights Residency',
        description: '123 Garden Avenue, Block A',
        type: 'building',
    },
    {
        id: '2',
        lat: 24.8650,
        lng: 66.9950,
        title: 'Fire Station #7',
        description: '2.3 km away • Response time: 5 min',
        type: 'fire_station',
    },
    {
        id: '3',
        lat: 24.8580,
        lng: 67.0050,
        title: 'Assembly Point A',
        description: 'Main Gate • Capacity: 500 people',
        type: 'assembly_point',
    },
    {
        id: '4',
        lat: 24.8620,
        lng: 67.0030,
        title: 'Smoke Sensor #12',
        description: 'Floor 3 • Status: Active',
        type: 'sensor',
    },
    {
        id: '5',
        lat: 24.8595,
        lng: 66.9990,
        title: 'Heat Sensor #8',
        description: 'Basement • Status: Active',
        type: 'sensor',
    },
];

function ResidentMapContent() {
    const { user } = useAuth();
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    const handleMarkerClick = useCallback((marker: MapMarker) => {
        setSelectedMarker(marker);
    }, []);

    return (
        <DashboardLayout role="resident" userName={user?.name || 'Resident'} userTitle="RESIDENT" disablePadding={true}>
            <div className="relative w-full h-full overflow-hidden min-h-[calc(100vh-64px)]">
                {/* Real Map */}
                <LiveMap
                    markers={sampleMarkers}
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
                            <span className="bg-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold">SAFE</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {/* Building Info Card */}
                            <div className="p-3 rounded-lg border border-border bg-muted/30">
                                <h4 className="font-bold text-sm text-foreground leading-tight">Green Heights Residency</h4>
                                <p className="text-xs text-muted-foreground mt-1">123 Garden Avenue, Block A</p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Floor 3</span>
                                    <span>Unit A-304</span>
                                </div>
                            </div>

                            {/* Safety Status */}
                            <div className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">All Clear</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">Now</span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground leading-tight">No Active Alerts</h4>
                                <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
                            </div>

                            {/* Recent Alert */}
                            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Resolved</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">2h ago</span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground leading-tight">Smoke Detector Test</h4>
                                <p className="text-xs text-muted-foreground mt-1">Floor 4 • Scheduled maintenance</p>
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
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900">
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                                <AlertTriangle className="h-4 w-4" />
                                Report Emergency
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
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Building Sensors</p>
                                <p className="text-xs font-bold text-foreground">12 Sensors Active <span className="text-green-500 ml-1">●</span></p>
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
                                <div className="size-3 bg-blue-500 rounded-full"></div>
                                <span className="text-muted-foreground">Building</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-red-500 rounded-full"></div>
                                <span className="text-muted-foreground">Fire Station</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-green-500 rounded-full"></div>
                                <span className="text-muted-foreground">Assembly Point</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-amber-500 rounded-full"></div>
                                <span className="text-muted-foreground">Sensor</span>
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
                            ×
                        </button>
                        <h4 className="font-bold text-sm text-foreground">{selectedMarker.title}</h4>
                        {selectedMarker.description && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedMarker.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2 capitalize">
                            Type: {selectedMarker.type.replace('_', ' ')}
                        </p>
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
