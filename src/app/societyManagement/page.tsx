'use client';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from 'react';

export default function SocietyManagementDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['manager', 'admin']}>
      <DashboardLayout role="manager" userName={user?.name || 'Sarah Connor'} userTitle="SOCIETY MANAGER" disablePadding={true}>
        <div className="flex h-full min-h-[calc(100vh-80px)] bg-[#f6f7f7] dark:bg-background-dark overflow-hidden">

          {/* Left Sidebar: Recent Activity Feed */}
          <aside className="w-80 bg-white/50 dark:bg-background-dark/50 border-r border-primary/10 flex flex-col backdrop-blur-sm shrink-0">
            <div className="p-6 border-b border-primary/10">
              <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">feed</span>
                Live Activity
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Activity Item */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-2 rounded-full bg-primary mt-2"></div>
                  <div className="w-px h-full bg-primary/10"></div>
                </div>
                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/5 shadow-sm flex-1">
                  <p className="text-xs font-bold text-primary/60 uppercase mb-1">Just now</p>
                  <p className="text-sm font-medium text-primary dark:text-white">Resident <span className="font-bold">Unit 402</span> submitted a maintenance request.</p>
                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold mt-2">Plumbing</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-2 rounded-full bg-primary/40 mt-2"></div>
                  <div className="w-px h-full bg-primary/10"></div>
                </div>
                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/5 shadow-sm flex-1">
                  <p className="text-xs font-bold text-primary/60 uppercase mb-1">20m ago</p>
                  <p className="text-sm font-medium text-primary dark:text-white">Visitor <span className="font-bold">#8821</span> checked out at Gate A.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="w-px h-full bg-primary/10"></div>
                </div>
                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/5 shadow-sm flex-1">
                  <p className="text-xs font-bold text-primary/60 uppercase mb-1">1h ago</p>
                  <p className="text-sm font-medium text-primary dark:text-white">Payment received from <span className="font-bold">Unit 102</span>.</p>
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold mt-2">$1,250.00</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="size-2 rounded-full bg-primary/40 mt-2"></div>
                  <div className="w-px h-full bg-primary/10"></div>
                </div>
                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-primary/5 shadow-sm flex-1">
                  <p className="text-xs font-bold text-primary/60 uppercase mb-1">3h ago</p>
                  <p className="text-sm font-medium text-primary dark:text-white">Daily cleaning log verified by Supervisor.</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8">
            {/* Header Stats */}
            <div className="flex flex-col gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Society Overview</h1>
                <p className="text-primary/60 dark:text-white/60">Grandview Heights Estate • ID #8291</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
                  <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-2">Occupancy</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-primary dark:text-white">92%</span>
                    <span className="text-sm font-bold text-green-600 mb-1">↑ 2%</span>
                  </div>
                  <div className="w-full bg-primary/5 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full w-[92%]"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
                  <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-2">Requests</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-primary dark:text-white">12</span>
                    <span className="text-sm font-bold text-orange-600 mb-1">5 New</span>
                  </div>
                  <div className="w-full bg-primary/5 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-orange-500 h-full w-[40%]"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
                  <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-2">Financials</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-primary dark:text-white">98%</span>
                    <span className="text-sm font-bold text-primary/60 mb-1">Collections</span>
                  </div>
                  <div className="w-full bg-primary/5 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-green-600 h-full w-[98%]"></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
                  <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-2">Staff</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-primary dark:text-white">24</span>
                    <span className="text-sm font-bold text-green-600 mb-1">Active</span>
                  </div>
                  <div className="w-full bg-primary/5 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-primary h-full w-[100%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Building List / Map Placeholder */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white dark:bg-white/5 border border-primary/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-primary dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined">apartment</span>
                      Properties Status
                    </h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">All</button>
                      <button className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-xs font-bold hover:bg-primary/10">Attention</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9fbfa] dark:bg-background-dark/30 border border-primary/5 hover:border-primary/20 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary dark:text-white">Tower A - Sunrise</p>
                          <p className="text-xs text-primary/60">Fully Compliant • Last checked today</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary/20 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9fbfa] dark:bg-background-dark/30 border border-primary/5 hover:border-primary/20 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary dark:text-white">Tower B - Meridian</p>
                          <p className="text-xs text-primary/60">Fully Compliant • Last checked yesterday</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary/20 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200/50 hover:border-orange-300 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                          <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary dark:text-white">Clubhouse Main</p>
                          <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">Maintenance Required: HVAC System</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-orange-400 group-hover:text-orange-600 transition-colors">chevron_right</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-primary/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-primary dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined">payments</span>
                      Financial Health
                    </h3>
                  </div>
                  <div className="flex items-center justify-center h-48 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                    <p className="text-primary/40 font-bold">Financial Charts Visualization</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Tasks */}
              <div className="flex flex-col gap-6">
                <div className="bg-primary text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                  <h3 className="text-lg font-bold mb-4 relative z-10">Quick Broadcast</h3>
                  <p className="text-sm text-white/80 mb-4 relative z-10">Send urgent notifications to all residents.</p>
                  <button className="w-full py-3 bg-white text-primary font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors relative z-10">
                    Create Announcement
                  </button>
                </div>

                <div className="bg-white dark:bg-white/5 border border-primary/10 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-lg text-primary dark:text-white mb-4">Pending Approvals</h3>
                  <div className="space-y-4">
                    <div className="border-b border-primary/5 pb-3">
                      <p className="text-sm font-bold text-primary dark:text-white">Renovation Request</p>
                      <p className="text-xs text-primary/60 mb-2">Unit 204 • Bathroom remodel</p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200">Approve</button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">Deny</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary dark:text-white">Vehicle Registration</p>
                      <p className="text-xs text-primary/60 mb-2">Unit 501 • Tesla Model 3</p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200">Approve</button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">Deny</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}