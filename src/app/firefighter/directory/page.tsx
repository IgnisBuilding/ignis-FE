'use client';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function DirectoryContent() {
    const { user } = useAuth();

    return (
        <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR" disablePadding={true}>
            <div className="flex h-full bg-[#f9fbfa] dark:bg-background-dark min-h-[calc(100vh-80px)]">
                {/* SideNavBar (Directory Filters) */}
                <aside className="w-72 border-r border-[#eaf0ef] dark:border-primary/20 p-6 flex flex-col justify-between bg-[#f9fbfa] dark:bg-background-dark shrink-0">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col">
                            <h1 className="text-primary dark:text-white text-base font-bold leading-normal">Directory Filters</h1>
                            <p className="text-[#60857d] text-xs font-normal leading-normal">Refine monitored building list</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white shadow-sm w-full text-left">
                                <span className="material-symbols-outlined text-xl">map</span>
                                <p className="text-sm font-semibold">Area Districts</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 text-[#60857d] hover:bg-[#eaf0ef] dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-xl">warning</span>
                                <p className="text-sm font-medium">Risk Priority</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 text-[#60857d] hover:bg-[#eaf0ef] dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-xl">group</span>
                                <p className="text-sm font-medium">Occupancy Range</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 text-[#60857d] hover:bg-[#eaf0ef] dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-xl">apartment</span>
                                <p className="text-sm font-medium">Structure Type</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 text-[#60857d] hover:bg-[#eaf0ef] dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-xl">calendar_month</span>
                                <p className="text-sm font-medium">Inspection Status</p>
                            </button>
                        </div>
                        <div className="pt-6 border-t border-[#eaf0ef] dark:border-primary/20">
                            <h3 className="text-xs font-bold text-[#60857d] uppercase tracking-widest mb-4">Saved Views</h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-primary dark:text-white px-3 cursor-pointer hover:bg-primary/5 py-1 rounded">
                                    <span>High-Rise Residential</span>
                                    <span className="text-[10px] bg-[#eaf0ef] dark:bg-primary px-1.5 py-0.5 rounded">12</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-primary dark:text-white px-3 cursor-pointer hover:bg-primary/5 py-1 rounded">
                                    <span>Overdue Inspections</span>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">04</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg h-10 bg-[#eaf0ef] dark:bg-primary/20 text-primary dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-opacity-80 transition-all border border-primary/5">
                        <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                        <span>Clear Filters</span>
                    </button>
                </aside>

                {/* Main Content Container */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* PageHeading */}
                    <div className="flex flex-wrap justify-between items-end gap-4 px-10 pt-8 pb-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-primary dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Building Safety Directory</p>
                            <p className="text-[#60857d] text-sm font-medium leading-normal">Managing safety protocols for 1,284 monitored complexes</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex h-10 items-center justify-center rounded-lg px-4 bg-[#eaf0ef] dark:bg-primary/20 text-primary dark:text-white text-sm font-bold tracking-[0.015em] hover:bg-opacity-70 transition-all">
                                <span className="material-symbols-outlined mr-2 text-lg">download</span>
                                <span className="truncate">Export Report</span>
                            </button>
                            <button className="flex h-10 items-center justify-center rounded-lg px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] hover:bg-opacity-90 shadow-md transition-all">
                                <span className="material-symbols-outlined mr-2 text-lg">add_location</span>
                                <span className="truncate">Register Facility</span>
                            </button>
                        </div>
                    </div>

                    {/* Chips (Active Filters) */}
                    <div className="flex gap-2 px-10 py-4 flex-wrap">
                        <button className="flex h-7 items-center justify-center gap-2 rounded-full bg-[#eaf0ef] dark:bg-primary/30 pl-3 pr-2 border border-primary/5">
                            <p className="text-primary dark:text-white text-[11px] font-bold uppercase tracking-wider">North District</p>
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                        <button className="flex h-7 items-center justify-center gap-2 rounded-full bg-[#eaf0ef] dark:bg-primary/30 pl-3 pr-2 border border-primary/5">
                            <p className="text-primary dark:text-white text-[11px] font-bold uppercase tracking-wider">Residential High-Rise</p>
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                        <button className="flex h-7 items-center justify-center gap-2 rounded-full border border-dashed border-[#60857d] px-3 hover:bg-primary/5 transition-colors">
                            <p className="text-[#60857d] text-[11px] font-bold uppercase tracking-wider">Add District</p>
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>

                    {/* Table Section */}
                    <div className="px-10 py-2 pb-12">
                        <div className="overflow-hidden rounded-xl border border-[#eaf0ef] dark:border-primary/20 bg-white dark:bg-background-dark/50 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eaf0ef]/50 dark:bg-primary/10 border-b border-[#eaf0ef] dark:border-primary/20">
                                        <th className="px-6 py-4 text-primary dark:text-white text-xs font-bold uppercase tracking-wider w-[35%]">
                                            <div className="flex items-center gap-2 cursor-pointer hover:text-primary/70">
                                                Building Name
                                                <span className="material-symbols-outlined text-xs">arrow_downward</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-primary dark:text-white text-xs font-bold uppercase tracking-wider">Occupancy</th>
                                        <th className="px-6 py-4 text-primary dark:text-white text-xs font-bold uppercase tracking-wider">Last Inspection</th>
                                        <th className="px-6 py-4 text-primary dark:text-white text-xs font-bold uppercase tracking-wider">Safety Score</th>
                                        <th className="px-6 py-4 text-primary dark:text-white text-xs font-bold uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eaf0ef] dark:divide-primary/10">
                                    {/* Row 1 */}
                                    <tr className="hover:bg-[#eaf0ef]/30 dark:hover:bg-primary/5 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded bg-[#eaf0ef] flex items-center justify-center dark:bg-primary/20">
                                                    <span className="material-symbols-outlined text-primary dark:text-white">apartment</span>
                                                </div>
                                                <div>
                                                    <p className="text-primary dark:text-white text-sm font-bold">Grandview Heights</p>
                                                    <p className="text-[#60857d] text-xs">1022 Marina Way, North District</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">450 Residents</td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">Oct 12, 2023</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 overflow-hidden rounded-full bg-[#eaf0ef] dark:bg-primary/20 h-1.5">
                                                    <div className="h-full bg-primary" style={{ width: '92%' }}></div>
                                                </div>
                                                <p className="text-primary dark:text-white text-sm font-bold">92</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
                                                CERTIFIED
                                            </span>
                                        </td>
                                    </tr>
                                    {/* Row 2 */}
                                    <tr className="hover:bg-[#eaf0ef]/30 dark:hover:bg-primary/5 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded bg-[#eaf0ef] flex items-center justify-center dark:bg-primary/20">
                                                    <span className="material-symbols-outlined text-primary dark:text-white">corporate_fare</span>
                                                </div>
                                                <div>
                                                    <p className="text-primary dark:text-white text-sm font-bold">The Meridian</p>
                                                    <p className="text-[#60857d] text-xs">404 Skyline Dr, North District</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">820 Residents</td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">Nov 05, 2023</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 overflow-hidden rounded-full bg-[#eaf0ef] dark:bg-primary/20 h-1.5">
                                                    <div className="h-full bg-primary/60" style={{ width: '78%' }}></div>
                                                </div>
                                                <p className="text-primary dark:text-white text-sm font-bold">78</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                                                PENDING
                                            </span>
                                        </td>
                                    </tr>
                                    {/* Row 3 */}
                                    <tr className="hover:bg-[#eaf0ef]/30 dark:hover:bg-primary/5 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded bg-red-50 flex items-center justify-center dark:bg-red-900/20">
                                                    <span className="material-symbols-outlined text-red-600">emergency</span>
                                                </div>
                                                <div>
                                                    <p className="text-primary dark:text-white text-sm font-bold">Oakwood Lofts</p>
                                                    <p className="text-[#60857d] text-xs">88 Forest Ave, East District</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">120 Residents</td>
                                        <td className="px-6 py-4 text-[#60857d] text-sm font-medium">Sep 28, 2023</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 overflow-hidden rounded-full bg-[#eaf0ef] dark:bg-primary/20 h-1.5">
                                                    <div className="h-full bg-red-500" style={{ width: '45%' }}></div>
                                                </div>
                                                <p className="text-primary dark:text-white text-sm font-bold">45</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-400">
                                                AT RISK
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-[#eaf0ef] dark:border-primary/20 bg-[#eaf0ef]/20 dark:bg-primary/5">
                                <p className="text-xs text-[#60857d] font-medium">Showing <span className="text-primary dark:text-white font-bold">1 - 3</span> of 1,284 results</p>
                                <div className="flex gap-1">
                                    <button className="flex size-8 items-center justify-center rounded border border-[#eaf0ef] dark:border-primary/30 text-[#60857d] hover:bg-white dark:hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                                    </button>
                                    <button className="flex size-8 items-center justify-center rounded bg-primary text-white text-xs font-bold">1</button>
                                    <button className="flex size-8 items-center justify-center rounded border border-[#eaf0ef] dark:border-primary/30 text-[#60857d] hover:bg-white dark:hover:bg-primary/20 text-xs font-bold transition-colors">2</button>
                                    <button className="flex size-8 items-center justify-center rounded border border-[#eaf0ef] dark:border-primary/30 text-[#60857d] hover:bg-white dark:hover:bg-primary/20 text-xs font-bold transition-colors">3</button>
                                    <span className="px-2 text-[#60857d]">...</span>
                                    <button className="flex size-8 items-center justify-center rounded border border-[#eaf0ef] dark:border-primary/30 text-[#60857d] hover:bg-white dark:hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function Directory() {
    return (
        <ProtectedRoute allowedRoles={['firefighter']}>
            <DirectoryContent />
        </ProtectedRoute>
    );
}
