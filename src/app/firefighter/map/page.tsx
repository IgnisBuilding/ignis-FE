'use client';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function MapViewContent() {
    const { user } = useAuth();

    return (
        <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR" disablePadding={true}>
            <div className="relative w-full h-full bg-[#f1f3f0] map-mesh overflow-hidden min-h-[calc(100vh-80px)]">
                <style jsx global>{`
          .map-mesh {
            background-color: #f1f3f0;
            background-image: 
                radial-gradient(#d1d5db 1px, transparent 1px),
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
            background-size: 40px 40px, 160px 160px, 160px 160px;
          }
        `}</style>

                {/* Floating Left Sidebar (Incident List) */}
                <aside className="absolute left-6 top-6 bottom-6 w-80 z-20 flex flex-col gap-3 pointer-events-none">
                    <div className="bg-white/90 dark:bg-background-dark/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-xl pointer-events-auto overflow-hidden flex flex-col flex-1">
                        <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-primary text-white">
                            <h3 className="font-bold text-sm tracking-wide uppercase">Active Incidents</h3>
                            <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">4 ALERT</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {/* Incident Card 1 */}
                            <div className="p-3 rounded-lg border border-red-600/20 bg-red-600/5 hover:bg-red-600/10 cursor-pointer transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Priority 1</span>
                                    <span className="text-[10px] text-primary/40 font-mono">#402-A</span>
                                </div>
                                <h4 className="font-bold text-sm text-primary leading-tight">Warehouse Fire - Pier 15</h4>
                                <p className="text-xs text-primary/60 mt-1">4 Units Assigned • 12m elapsed</p>
                            </div>
                            {/* Incident Card 2 */}
                            <div className="p-3 rounded-lg border border-primary/10 bg-white dark:bg-white/5 hover:bg-primary/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Priority 2</span>
                                    <span className="text-[10px] text-primary/40 font-mono">#388-C</span>
                                </div>
                                <h4 className="font-bold text-sm text-primary leading-tight">Brush Fire - North Trail</h4>
                                <p className="text-xs text-primary/60 mt-1">2 Units Assigned • 45m elapsed</p>
                            </div>
                            {/* Incident Card 3 */}
                            <div className="p-3 rounded-lg border border-primary/10 bg-white dark:bg-white/5 hover:bg-primary/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Priority 3</span>
                                    <span className="text-[10px] text-primary/40 font-mono">#415-F</span>
                                </div>
                                <h4 className="font-bold text-sm text-primary leading-tight">Structure Check - 5th Ave</h4>
                                <p className="text-xs text-primary/60 mt-1">1 Unit En Route • 3m elapsed</p>
                            </div>
                        </div>
                        <div className="p-3 bg-primary/5 border-t border-primary/10">
                            <button className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-xs font-bold">
                                <span className="material-symbols-outlined !text-sm">add</span>
                                New Dispatch
                            </button>
                        </div>
                    </div>
                    {/* Sensor Summary Stats */}
                    <div className="bg-white/90 dark:bg-background-dark/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-lg pointer-events-auto p-3">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                <span className="material-symbols-outlined !text-lg">sensors</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-primary/40">Sensor Network</p>
                                <p className="text-xs font-bold text-primary">124 Nodes Online <span className="text-green-600 ml-1">●</span></p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Simulated Map Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChGSvi0cZ-v_57IuG1a-qXM6he60oH1I9eJDolR4U07ERs93MMWdcvHXxVPcB17DuJHVMjxYx31iQgDffIHrG44hxdsinZxMm384MRv9v-Za1tKhbLroK4KhsjXrIJuGhxOtl4NIYh7EYJWKjL6Spk9A97JBEuwbGUMNCe-JAtfLg3DGbTvLLSetYyLIVjKE41T_rvAGlgY__1FxOT50NVzht4Vpx4dGYApRnjSiB9LkstxFCh4_IFpoX5tByLaIAKNIiwVpoweWQ')" }}></div>

                    {/* Map Marker: Active Fire (Pulsing) */}
                    <div className="absolute top-[35%] left-[55%] z-10">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute size-16 bg-red-600/20 rounded-full pulse-red"></div>
                            <div className="absolute size-8 bg-red-600/40 rounded-full pulse-red" style={{ animationDelay: '0.5s' }}></div>
                            <div className="size-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                                <span className="material-symbols-outlined !text-sm">local_fire_department</span>
                            </div>
                            {/* Marker Tooltip */}
                            <div className="absolute bottom-full mb-3 bg-white p-3 rounded-lg shadow-xl border border-primary/10 w-48 pointer-events-none">
                                <p className="text-[10px] font-bold text-red-600 uppercase">Extreme Hazard</p>
                                <h5 className="text-sm font-bold text-primary">Warehouse 15</h5>
                                <div className="flex justify-between mt-2 text-[10px] text-primary/60">
                                    <span>Temp: 450°C</span>
                                    <span>Wind: 12km/h</span>
                                </div>
                                <div className="w-full bg-primary/10 h-1 mt-2 rounded-full overflow-hidden">
                                    <div className="bg-red-600 h-full w-[85%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Marker: Sensor Nodes */}
                    <div className="absolute top-[20%] left-[40%]">
                        <div className="size-3 bg-green-500 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"></div>
                    </div>
                    <div className="absolute top-[50%] left-[30%]">
                        <div className="size-3 bg-green-500 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"></div>
                    </div>
                    <div className="absolute top-[70%] left-[65%]">
                        <div className="size-3 bg-green-500 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"></div>
                    </div>
                    <div className="absolute top-[45%] left-[48%]">
                        <div className="size-3 bg-amber-500 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"></div>
                    </div>
                </div>

                {/* Bottom Right Controls */}
                <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20">
                    {/* Layers Toggle */}
                    <div className="bg-white/90 dark:bg-background-dark/95 backdrop-blur-md rounded-xl border border-primary/10 shadow-xl overflow-hidden flex flex-col p-1">
                        <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary hover:text-white rounded-lg transition-colors group">
                            <span className="material-symbols-outlined text-primary group-hover:text-white">layers</span>
                            <span className="text-sm font-semibold pr-2">Map Layers</span>
                        </button>
                    </div>

                    <button className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined">explore</span>
                    </button>
                </div>
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
