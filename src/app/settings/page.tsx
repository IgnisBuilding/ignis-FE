'use client';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

function SettingsContent() {
    const { user } = useAuth();

    // Custom switch styles
    const switchStyles = `
    .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
    }
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider-round {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #d6e1de;
        transition: .4s;
        border-radius: 34px;
    }
    .slider-round:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    input:checked + .slider-round {
        background-color: #1a3d35;
    }
    input:checked + .slider-round:before {
        transform: translateX(20px);
    }
  `;

    return (
        <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR" disablePadding={true}>
            <style jsx global>{switchStyles}</style>
            <div className="flex h-full overflow-hidden min-h-[calc(100vh-80px)]">
                {/* Side Navigation Bar */}
                <aside className="w-72 bg-[#f9fbfa] dark:bg-background-dark border-r border-[#d6e1de] flex flex-col justify-between p-6 shrink-0">
                    <div className="flex flex-col gap-8">
                        <nav className="flex flex-col gap-2">
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#eaf0ef] text-primary w-full text-left">
                                <span className="material-symbols-outlined text-[22px]">settings</span>
                                <p className="text-sm font-semibold">System</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-[22px] text-[#60857d]">notifications</span>
                                <p className="text-sm font-medium text-[#4a635e]">Notifications</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-[22px] text-[#60857d]">group</span>
                                <p className="text-sm font-medium text-[#4a635e]">Users</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-[22px] text-[#60857d]">sensors</span>
                                <p className="text-sm font-medium text-[#4a635e]">IoT Sensors</p>
                            </button>
                            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors w-full text-left">
                                <span className="material-symbols-outlined text-[22px] text-[#60857d]">security</span>
                                <p className="text-sm font-medium text-[#4a635e]">Security & Privacy</p>
                            </button>
                        </nav>
                    </div>
                    {/* Footer Sidebar Action */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#60857d]">System Status</p>
                            </div>
                            <p className="text-xs font-semibold text-primary">All nodes operational</p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#f6f7f7] dark:bg-background-dark">
                    {/* Page Header */}
                    <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-6 bg-[#f6f7f7]/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#d6e1de]">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-3xl font-black tracking-tight text-primary">System Settings</h2>
                            <p className="text-[#60857d] text-sm">Configure your elite firefighter command dashboard and sensor networks.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-6 py-2 rounded-lg bg-white border border-[#d6e1de] text-sm font-bold text-primary hover:bg-gray-50 transition-colors">
                                Discard
                            </button>
                            <button className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </header>

                    {/* Settings Content */}
                    <div className="max-w-4xl mx-auto px-10 py-10 space-y-12 pb-24">
                        {/* Section: General Configuration */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">display_settings</span>
                                General Configuration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* TextField */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-primary">Command Center Name</label>
                                    <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder="e.g. Ignis Alpha One" type="text" defaultValue="North Division Headquarters" />
                                </div>
                                {/* SelectField */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-primary">Time Zone</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm">
                                            <option>Pacific Standard Time (PST)</option>
                                            <option>Mountain Standard Time (MST)</option>
                                            <option>Central Standard Time (CST)</option>
                                            <option>Eastern Standard Time (EST)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#60857d] pointer-events-none">unfold_more</span>
                                    </div>
                                </div>
                                {/* TextField Full Width */}
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-primary">Data Backup Endpoint (URL)</label>
                                    <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder="https://backup.ignis-command.com/v1" type="text" defaultValue="https://hq-vault-01.ignis-ops.org/backup" />
                                </div>
                            </div>
                        </section>
                        <hr className="border-[#d6e1de]" />
                        {/* Section: Notification & Alerts */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">campaign</span>
                                Alerting & Notifications
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold text-primary">Critical Priority Radio Dispatch</p>
                                        <p className="text-xs text-[#60857d]">Automatically broadcast high-priority fire alerts to field units via digital radio.</p>
                                    </div>
                                    <label className="switch">
                                        <input defaultChecked type="checkbox" />
                                        <span className="slider-round"></span>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold text-primary">SMS Emergency Escalation</p>
                                        <p className="text-xs text-[#60857d]">Notify all off-duty personnel when containment falls below 30%.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider-round"></span>
                                    </label>
                                </div>
                                <div className="flex flex-col gap-4 p-4 rounded-xl bg-white border border-[#d6e1de]">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Alert Volume Threshold</p>
                                            <p className="text-xs text-[#60857d]">The decibel level for high-intensity siren hardware.</p>
                                        </div>
                                        <span className="text-sm font-black text-primary">85%</span>
                                    </div>
                                    <input className="w-full h-2 bg-[#d6e1de] rounded-lg appearance-none cursor-pointer accent-primary" max="100" min="0" type="range" defaultValue="85" />
                                </div>
                            </div>
                        </section>
                        <hr className="border-[#d6e1de]" />
                        {/* Section: IoT Sensor Sensitivity */}
                        <section>
                            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">analytics</span>
                                IoT Sensor Calibration
                            </h3>
                            <p className="text-sm text-[#60857d] mb-6">Fine-tune the sensitivity of remote thermal and air quality sensors to reduce false positives during dry seasons.</p>
                            <div className="bg-white border border-[#d6e1de] rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-primary/5 border-b border-[#d6e1de]">
                                            <th className="px-6 py-4 font-bold text-primary">Sensor Type</th>
                                            <th className="px-6 py-4 font-bold text-primary">Threshold (Trigger)</th>
                                            <th className="px-6 py-4 font-bold text-primary text-right">Last Calibrated</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#d6e1de]">
                                        <tr>
                                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-lg">thermostat</span>
                                                Thermal Core
                                            </td>
                                            <td className="px-6 py-4">
                                                <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] rounded-full appearance-none" type="range" />
                                                <span className="ml-2 font-bold">145°F</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[#60857d]">12h ago</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-lg">air</span>
                                                Particulate Matter (PM2.5)
                                            </td>
                                            <td className="px-6 py-4">
                                                <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] rounded-full appearance-none" type="range" />
                                                <span className="ml-2 font-bold">150 μg</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[#60857d]">2d ago</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        {/* Danger Zone */}
                        <section className="mt-20 border-t-2 border-red-100 pt-10">
                            <h3 className="text-red-700 text-lg font-bold mb-2 uppercase tracking-widest text-[10px]">Danger Zone</h3>
                            <div className="flex items-center justify-between p-6 rounded-xl bg-red-50 border border-red-100">
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-red-900">System Reset</p>
                                    <p className="text-xs text-red-700">Wipe all command data and disconnect IoT sensors. This action is permanent.</p>
                                </div>
                                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all">
                                    Purge System
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}

export default function Settings() {
    return (
        <ProtectedRoute allowedRoles={['firefighter']}>
            <SettingsContent />
        </ProtectedRoute>
    );
}
