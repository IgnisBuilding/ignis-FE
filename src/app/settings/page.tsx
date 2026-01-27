'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Bell, Users, Wifi, Shield, Monitor, Megaphone, Gauge, Thermometer, Wind, ChevronDown } from 'lucide-react';

type SettingsTab = 'system' | 'notifications' | 'users' | 'sensors' | 'security';

function SettingsContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('system');

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

    const tabs = [
        { id: 'system' as SettingsTab, label: 'System', icon: SettingsIcon },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
        { id: 'users' as SettingsTab, label: 'Users', icon: Users },
        { id: 'sensors' as SettingsTab, label: 'IoT Sensors', icon: Wifi },
        { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
    ];

    return (
        <DashboardLayout role="admin" userName={user?.name || 'Admin'} userTitle="ADMINISTRATOR">
            <style jsx global>{switchStyles}</style>
            <div className="flex-1 p-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">System Settings</h1>
                        <p className="text-gray-600">Configure your IGNIS building management system and sensor networks.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                            Discard
                        </button>
                        <button className="px-6 py-2 rounded-lg green-gradient text-white text-sm font-bold shadow-lg hover:opacity-90 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="premium-card rounded-xl overflow-hidden">
                    <div className="p-6 md:p-10 space-y-12">

                        {/* System Tab Content */}
                        {activeTab === 'system' && (
                            <>
                                <section>
                                    <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                        <Monitor className="w-5 h-5" />
                                        General Configuration
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">Command Center Name</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder="e.g. Ignis Alpha One" type="text" defaultValue="IGNIS Building Complex" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">Time Zone</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm">
                                                    <option>Pacific Standard Time (PST)</option>
                                                    <option>Mountain Standard Time (MST)</option>
                                                    <option>Central Standard Time (CST)</option>
                                                    <option>Eastern Standard Time (EST)</option>
                                                </select>
                                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#60857d] pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-primary">Data Backup Endpoint (URL)</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder="https://backup.ignis-command.com/v1" type="text" defaultValue="https://backup.ignis-system.com/v1" />
                                        </div>
                                    </div>
                                </section>
                                <hr className="border-[#d6e1de]" />
                                <section className="border-t-2 border-red-100 pt-10">
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
                            </>
                        )}

                        {/* Notifications Tab Content */}
                        {activeTab === 'notifications' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Megaphone className="w-5 h-5" />
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
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Email Notifications</p>
                                            <p className="text-xs text-[#60857d]">Send email alerts to building management for all incidents.</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
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
                        )}

                        {/* Users Tab Content */}
                        {activeTab === 'users' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    User Management
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Allow Self Registration</p>
                                            <p className="text-xs text-[#60857d]">Allow residents to register themselves via the public portal.</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Require Email Verification</p>
                                            <p className="text-xs text-[#60857d]">New users must verify their email before accessing the system.</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Two-Factor Authentication</p>
                                            <p className="text-xs text-[#60857d]">Require 2FA for all administrator accounts.</p>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-primary">Session Timeout (minutes)</label>
                                        <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" type="number" defaultValue="30" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* IoT Sensors Tab Content */}
                        {activeTab === 'sensors' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Gauge className="w-5 h-5" />
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
                                                    <Thermometer className="w-5 h-5 text-primary" />
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
                                                    <Wind className="w-5 h-5 text-primary" />
                                                    Particulate Matter (PM2.5)
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] rounded-full appearance-none" type="range" />
                                                    <span className="ml-2 font-bold">150 μg</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[#60857d]">2d ago</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                    <Wifi className="w-5 h-5 text-primary" />
                                                    Smoke Detector
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] rounded-full appearance-none" type="range" />
                                                    <span className="ml-2 font-bold">0.5%/ft</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[#60857d]">1d ago</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* Security Tab Content */}
                        {activeTab === 'security' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Security & Privacy
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Data Encryption</p>
                                            <p className="text-xs text-[#60857d]">Encrypt all sensitive data at rest using AES-256.</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">Audit Logging</p>
                                            <p className="text-xs text-[#60857d]">Log all user actions and system events for compliance.</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#d6e1de]">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">IP Whitelisting</p>
                                            <p className="text-xs text-[#60857d]">Restrict admin access to approved IP addresses only.</p>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-primary">Data Retention Period (days)</label>
                                        <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" type="number" defaultValue="365" />
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function Settings() {
    return (
        <ProtectedRoute allowedRoles={['management', 'building_authority']}>
            <SettingsContent />
        </ProtectedRoute>
    );
}
