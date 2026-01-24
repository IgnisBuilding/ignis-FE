'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Maximize2, Minimize2, Building2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadSampleFloorPlan } from '@/lib/map/sampleFloorPlan';

// Dynamically import EvacuationMap to avoid SSR issues
const EvacuationMap = dynamic(() => import('./EvacuationMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
                <p className="text-sm text-muted-foreground">Loading floor plan...</p>
            </div>
        </div>
    )
});

export interface BuildingInfo {
    id: string;
    name: string;
    address?: string;
    status?: 'normal' | 'warning' | 'alert';
    floors?: number;
    units?: number;
}

interface BuildingFloorPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    building: BuildingInfo | null;
}

export default function BuildingFloorPlanModal({
    isOpen,
    onClose,
    building
}: BuildingFloorPlanModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mapKey, setMapKey] = useState(0);
    const [dataStatus, setDataStatus] = useState<'checking' | 'loading' | 'ready' | 'error'>('checking');

    // Load building data when modal opens
    const ensureBuildingData = useCallback(async () => {
        if (!building) return;

        setIsLoading(true);
        setDataStatus('checking');

        try {
            // Always upload fresh sample data to ensure correct format
            // This handles cases where old/incorrect data might be cached
            setDataStatus('loading');
            console.log('[FloorPlanModal] Uploading sample floor plan data...');
            const uploaded = await uploadSampleFloorPlan(building.name);

            if (!uploaded) {
                console.error('[FloorPlanModal] Failed to upload sample data');
                setDataStatus('error');
                setIsLoading(false);
                return;
            }

            console.log('[FloorPlanModal] Sample data uploaded successfully');
            setDataStatus('ready');
            // Increment key to force EvacuationMap to reload
            setMapKey(prev => prev + 1);
        } catch (error) {
            console.error('[FloorPlanModal] Error ensuring building data:', error);
            setDataStatus('error');
        } finally {
            setIsLoading(false);
        }
    }, [building]);

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && building) {
            ensureBuildingData();
        }
    }, [isOpen, building, ensureBuildingData]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, isFullscreen, onClose]);

    if (!isOpen || !building) return null;

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'alert': return 'bg-red-500';
            case 'warning': return 'bg-amber-500';
            default: return 'bg-green-500';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'alert': return 'ALERT';
            case 'warning': return 'WARNING';
            default: return 'NORMAL';
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isFullscreen
                        ? 'w-screen h-screen rounded-none'
                        : 'w-[95vw] h-[90vh] max-w-7xl'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#1f3d2f] text-white">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg">{building.name}</h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(building.status)}`}>
                                    {getStatusText(building.status)}
                                </span>
                            </div>
                            {building.address && (
                                <p className="text-sm text-white/70">{building.address}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Building Stats */}
                        {(building.floors || building.units) && (
                            <div className="hidden sm:flex items-center gap-4 mr-4 text-sm text-white/80">
                                {building.floors && (
                                    <span>{building.floors} Floors</span>
                                )}
                                {building.units && (
                                    <span>{building.units} Units</span>
                                )}
                            </div>
                        )}

                        {/* Fullscreen Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-white hover:bg-white/10"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-5 w-5" />
                            ) : (
                                <Maximize2 className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/10"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Map Content */}
                <div className="flex-1 relative">
                    {isLoading || dataStatus === 'checking' || dataStatus === 'loading' ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1f3d2f]"></div>
                                <p className="text-sm text-muted-foreground">
                                    {dataStatus === 'checking' ? 'Checking floor plan data...' :
                                     dataStatus === 'loading' ? 'Loading floor plan...' :
                                     'Preparing floor plan...'}
                                </p>
                            </div>
                        </div>
                    ) : dataStatus === 'error' ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                            <div className="flex flex-col items-center gap-4 text-center px-4">
                                <AlertTriangle className="h-12 w-12 text-amber-500" />
                                <div>
                                    <h3 className="font-semibold text-lg">Floor Plan Unavailable</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Unable to load floor plan data. Please try again.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={ensureBuildingData}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <EvacuationMap
                            key={mapKey}
                            className="w-full h-full"
                            showControls={true}
                            showLegend={true}
                            showEmergencyControls={true}
                        />
                    )}
                </div>

                {/* Footer with Quick Actions */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Building ID: {building.id}</span>
                        <span>•</span>
                        <span>Press ESC to close</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        {building.status === 'alert' && (
                            <Button
                                size="sm"
                                className="text-xs bg-red-600 hover:bg-red-700"
                            >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                View Emergency
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
