'use client';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function TeamManagementContent() {
    const { user } = useAuth();

    return (
        <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR">
            <div className="max-w-[1280px] mx-auto w-full">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <a className="text-primary/60 text-sm font-medium hover:text-primary transition-colors" href="#">Ignis</a>
                    <span className="text-primary/40 text-sm font-medium">/</span>
                    <span className="text-primary dark:text-white text-sm font-semibold">Teams Management</span>
                </div>

                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex min-w-72 flex-col gap-2">
                        <h1 className="text-primary dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Responder Team Management</h1>
                        <p className="text-primary/60 dark:text-slate-400 text-base font-normal leading-normal">Manage and allocate elite fire response units across sectors.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary/5 text-primary text-sm font-bold border border-primary/10 hover:bg-primary/10 transition-all">
                            <span className="truncate">Export Report</span>
                        </button>
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                            <span className="truncate">Schedule Shift</span>
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="flex flex-wrap gap-4 mb-10">
                    <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-primary/10 border border-primary/5 shadow-sm">
                        <p className="text-primary/60 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Active Teams</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-primary dark:text-white text-3xl font-bold leading-tight">12</p>
                            <span className="text-[#07882e] text-sm font-semibold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span>5%</span>
                        </div>
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-primary/10 border border-primary/5 shadow-sm">
                        <p className="text-primary/60 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">On-Duty Personnel</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-primary dark:text-white text-3xl font-bold leading-tight">42</p>
                            <span className="text-[#07882e] text-sm font-semibold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span>12%</span>
                        </div>
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-primary/10 border border-primary/5 shadow-sm">
                        <p className="text-primary/60 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Vehicles Active</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-primary dark:text-white text-3xl font-bold leading-tight">18</p>
                            <span className="text-[#e72e08] text-sm font-semibold flex items-center"><span className="material-symbols-outlined text-sm">arrow_downward</span>2%</span>
                        </div>
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-primary/10 border border-primary/5 shadow-sm">
                        <p className="text-primary/60 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Available Capacity</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-primary dark:text-white text-3xl font-bold leading-tight">15%</p>
                            <span className="text-primary/40 text-sm font-semibold">Steady</span>
                        </div>
                    </div>
                </div>

                {/* Team Grid Sections */}
                <div className="space-y-12 pb-12">
                    {/* Section 1: On-Duty (Responding) */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-primary dark:text-white text-2xl font-bold">On-Duty: Responding</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#e72e08]/10 text-[#e72e08] text-xs font-bold uppercase tracking-wider">Priority Alpha</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 1 */}
                            <div className="bg-white dark:bg-primary/5 border border-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Alpha</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#e72e08] animate-pulse"></span>
                                                <p className="text-[#e72e08] text-xs font-bold uppercase">Responding</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-primary/40 material-symbols-outlined cursor-pointer hover:text-primary transition-colors">more_vert</span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/60 text-sm">local_fire_department</span>
                                        <span className="text-primary/80 dark:text-slate-300 text-sm font-medium tracking-tight leading-none">Ladder 12</span>
                                    </div>
                                    <span className="text-xs text-primary/40 font-bold uppercase">Unit ID: 402-A</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">Assign</button>
                                    <button className="flex-1 bg-white dark:bg-transparent border border-primary/20 text-primary dark:text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors">Contact</button>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-white dark:bg-primary/5 border border-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Sigma</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#e72e08] animate-pulse"></span>
                                                <p className="text-[#e72e08] text-xs font-bold uppercase">Responding</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-primary/40 material-symbols-outlined cursor-pointer">more_vert</span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/60 text-sm">earth_engine</span>
                                        <span className="text-primary/80 dark:text-slate-300 text-sm font-medium tracking-tight leading-none">Engine 42</span>
                                    </div>
                                    <span className="text-xs text-primary/40 font-bold uppercase">Unit ID: 101-C</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">Assign</button>
                                    <button className="flex-1 bg-white dark:bg-transparent border border-primary/20 text-primary dark:text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors">Contact</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: On-Duty (Idle/Available) */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 border-t border-primary/10 pt-10">
                            <h2 className="text-primary dark:text-white text-2xl font-bold">On-Duty: Idle</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#07882e]/10 text-[#07882e] text-xs font-bold uppercase tracking-wider">Ready for Deployment</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 3 */}
                            <div className="bg-white dark:bg-primary/5 border border-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Delta</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#07882e]"></span>
                                                <p className="text-[#07882e] text-xs font-bold uppercase">Idle</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-primary/40 material-symbols-outlined cursor-pointer">more_vert</span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/60 text-sm">airport_shuttle</span>
                                        <span className="text-primary/80 dark:text-slate-300 text-sm font-medium tracking-tight leading-none">Rescue 5</span>
                                    </div>
                                    <span className="text-xs text-primary/40 font-bold uppercase">Unit ID: 305-R</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">Assign</button>
                                    <button className="flex-1 bg-white dark:bg-transparent border border-primary/20 text-primary dark:text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors">Contact</button>
                                </div>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-white dark:bg-primary/5 border border-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Bravo</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#07882e]"></span>
                                                <p className="text-[#07882e] text-xs font-bold uppercase">Idle</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-primary/40 material-symbols-outlined cursor-pointer">more_vert</span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/60 text-sm">local_fire_department</span>
                                        <span className="text-primary/80 dark:text-slate-300 text-sm font-medium tracking-tight leading-none">Engine 08</span>
                                    </div>
                                    <span className="text-xs text-primary/40 font-bold uppercase">Unit ID: 108-E</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">Assign</button>
                                    <button className="flex-1 bg-white dark:bg-transparent border border-primary/20 text-primary dark:text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors">Contact</button>
                                </div>
                            </div>
                            {/* Card 5 */}
                            <div className="bg-white dark:bg-primary/5 border border-primary/5 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Zulu</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#07882e]"></span>
                                                <p className="text-[#07882e] text-xs font-bold uppercase">Idle</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-primary/40 material-symbols-outlined cursor-pointer">more_vert</span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/60 text-sm">local_fire_department</span>
                                        <span className="text-primary/80 dark:text-slate-300 text-sm font-medium tracking-tight leading-none">Ladder 01</span>
                                    </div>
                                    <span className="text-xs text-primary/40 font-bold uppercase">Unit ID: 401-A</span>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">Assign</button>
                                    <button className="flex-1 bg-white dark:bg-transparent border border-primary/20 text-primary dark:text-white text-sm font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors">Contact</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Offline */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 border-t border-primary/10 pt-10">
                            <h2 className="text-primary dark:text-white text-2xl font-bold">Offline / Maintenance</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#60857d]/10 text-[#60857d] text-xs font-bold uppercase tracking-wider">Shift Ended</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Card 6 */}
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 opacity-70 grayscale-[0.5]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">groups</span>
                                        </div>
                                        <div>
                                            <h3 className="text-primary dark:text-white font-bold text-lg">Team Kilo</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#60857d]"></span>
                                                <p className="text-[#60857d] text-xs font-bold uppercase">Offline</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary/40 text-sm">engineering</span>
                                        <span className="text-primary/40 text-sm font-medium tracking-tight leading-none italic">Unassigned</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-primary/20 text-primary text-sm font-bold py-2.5 rounded-lg cursor-not-allowed">Activate</button>
                                    <button className="flex-1 border border-primary/10 text-primary/40 text-sm font-bold py-2.5 rounded-lg">View Logs</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function TeamManagement() {
    return (
        <ProtectedRoute allowedRoles={['firefighter']}>
            <TeamManagementContent />
        </ProtectedRoute>
    );
}
