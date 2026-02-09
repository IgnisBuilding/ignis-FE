'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';
import { api, type Floor } from '@/lib/api';
import { AlertTriangle, Building2 } from 'lucide-react';

// Dynamically import EvacuationMap to avoid SSR issues with MapLibre
const EvacuationMap = dynamic(
    () => import('@/components/maps/EvacuationMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
                    <p className="text-sm text-muted-foreground">Loading building map...</p>
                </div>
            </div>
        )
    }
);

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
    };
    status: string;
    occupied: boolean;
}

function ResidentMapContent() {
    const { user, dashboardRole, roleTitle } = useAuth();
    const [apartmentInfo, setApartmentInfo] = useState<ApartmentInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Floor plan state
    const [floors, setFloors] = useState<Floor[]>([]);
    const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
    const [floorPlanData, setFloorPlanData] = useState<any>(null);
    const [floorPlanLoading, setFloorPlanLoading] = useState(false);

    // Fetch apartment data
    useEffect(() => {
        const fetchApartmentData = async () => {
            try {
                const token = localStorage.getItem('ignis_token');
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
                        number: data.unit_number || data.number,
                        floor: {
                            id: data.floor?.id || 1,
                            name: data.floor?.name || `Floor ${data.floor?.level || 1}`,
                            level: data.floor?.level || 1,
                        },
                        building: {
                            id: data.building?.id || 1,
                            name: data.building?.name || 'My Building',
                            address: data.building?.address || 'Address',
                            type: data.building?.type || 'residential',
                            has_floor_plan: data.building?.has_floor_plan || false,
                        },
                        status: data.occupied ? 'Occupied' : 'Vacant',
                        occupied: data.occupied,
                    };
                    setApartmentInfo(transformedData);
                }

            } catch (error) {
                console.error('Failed to fetch apartment data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApartmentData();
    }, []);

    // Fetch building floor plan once we have the building ID
    useEffect(() => {
        if (!apartmentInfo?.building.id) return;

        const fetchFloorPlan = async () => {
            try {
                setFloorPlanLoading(true);
                const buildingId = apartmentInfo.building.id;

                // Fetch floors
                const buildingFloors = await api.getBuildingFloors(buildingId);
                const sortedFloors = buildingFloors.sort((a, b) => b.level - a.level);
                setFloors(sortedFloors);

                // Set the resident's floor as active, or default to first
                const residentFloor = sortedFloors.find(f => f.id === apartmentInfo.floor.id)
                    || sortedFloors.find(f => f.level === apartmentInfo.floor.level)
                    || sortedFloors[0];
                if (residentFloor) setActiveFloor(residentFloor);

                // Fetch floor plan GeoJSON
                try {
                    const floorPlan = await api.getBuildingFloorPlan(buildingId);
                    setFloorPlanData(floorPlan);
                } catch (fpError) {
                    console.error('Failed to fetch floor plan:', fpError);
                }
            } catch (error) {
                console.error('Failed to fetch building data:', error);
            } finally {
                setFloorPlanLoading(false);
            }
        };

        fetchFloorPlan();
    }, [apartmentInfo?.building.id]);

    const handleRoomClick = useCallback((room: GeoJSON.Feature) => {
        // Could show room details in a tooltip/panel
    }, []);

    return (
        <DashboardLayout role={dashboardRole} userName={user?.name || 'Resident'} userTitle={roleTitle} disablePadding={true}>
            <div className="relative w-full h-full overflow-hidden min-h-[calc(100vh-64px)] flex">
                {/* Floor Selector (left strip) */}
                {floors.length > 0 && (
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 border-r border-border bg-card px-3 py-4 z-10">
                        {floors.map((floor) => (
                            <button
                                key={floor.id}
                                type="button"
                                onClick={() => setActiveFloor(floor)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                                    activeFloor?.id === floor.id
                                        ? 'bg-[#1f3d2f] text-white'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                F{String(floor.level).padStart(2, '0')}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main content area */}
                <div className="relative flex-1 min-w-0">
                    {/* Floor Plan / Map */}
                    {loading || floorPlanLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
                                <p className="text-sm text-muted-foreground">Loading building map...</p>
                            </div>
                        </div>
                    ) : apartmentInfo && floorPlanData ? (
                        <EvacuationMap
                            className="absolute inset-0"
                            showControls={true}
                            showLegend={false}
                            showEmergencyControls={false}
                            showFloorSelector={false}
                            floor={activeFloor ? `floor${activeFloor.level}` as 'floor1' | 'floor2' : 'floor1'}
                            onRoomClick={handleRoomClick}
                            buildingId={apartmentInfo.building.id}
                            floorPlanData={floorPlanData}
                            activeFloorLevel={activeFloor?.level}
                            activeFloorId={activeFloor?.id}
                        />
                    ) : apartmentInfo && !floorPlanData ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/10">
                            <div className="text-center">
                                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                                <h3 className="text-lg font-semibold text-foreground mb-1">No Floor Plan Available</h3>
                                <p className="text-sm text-muted-foreground">The building floor plan has not been set up yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/10">
                            <div className="text-center">
                                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                                <h3 className="text-lg font-semibold text-foreground mb-1">No Apartment Assigned</h3>
                                <p className="text-sm text-muted-foreground">Contact your building management for apartment assignment.</p>
                            </div>
                        </div>
                    )}


                    {/* Active floor indicator */}
                    {activeFloor && apartmentInfo && (
                        <div className="absolute top-4 right-4 z-[10] bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-lg border border-border shadow-lg px-4 py-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Viewing</p>
                            <p className="text-sm font-bold text-foreground">{activeFloor.name} — {apartmentInfo.building.name}</p>
                        </div>
                    )}
                </div>
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
