'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/providers/SettingsProvider';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Bell, Users, Wifi, Shield, Monitor, Gauge, Thermometer, Wind, ChevronDown, User, Lock, Eye } from 'lucide-react';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'system' | 'users' | 'sensors';

interface FormState {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'ur';
    notifyPush: boolean;
    notifyEmail: boolean;
    notifySms: boolean;
    notifyMaintenance: boolean;
    notifyCommunity: boolean;
}

const defaultFormState: FormState = {
    theme: 'light',
    language: 'en',
    notifyPush: true,
    notifyEmail: true,
    notifySms: true,
    notifyMaintenance: true,
    notifyCommunity: false,
};

function SettingsContent() {
    const { user, role, dashboardRole, roleTitle, updateUser } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { setTheme } = useTheme();
    const { t, setLanguage } = useLanguage();
    const { toast } = useToast();

    const isAdmin = role === 'admin' || role === 'commander' || role === 'management' || role === 'building_authority' || role === 'firefighter_hq';
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [formState, setFormState] = useState<FormState>(defaultFormState);
    const [saving, setSaving] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({ name: '', phone: '', emergencyContact: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [savingPassword, setSavingPassword] = useState(false);

    // Track saved values so we can revert on discard/unmount
    const savedRef = useRef<FormState>(defaultFormState);

    // Sync profile form from user context
    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                emergencyContact: user.emergencyContact || '',
            });
        }
    }, [user]);

    // Sync form state from settings when loaded from API
    useEffect(() => {
        if (settings) {
            const loaded: FormState = {
                theme: settings.theme,
                language: settings.language,
                notifyPush: settings.notifyPush,
                notifyEmail: settings.notifyEmail,
                notifySms: settings.notifySms,
                notifyMaintenance: settings.notifyMaintenance,
                notifyCommunity: settings.notifyCommunity,
            };
            setFormState(loaded);
            savedRef.current = loaded;
        }
    }, [settings]);

    // Stable refs for setters so effects don't re-fire on reference changes
    const setThemeRef = useRef(setTheme);
    const setLanguageRef = useRef(setLanguage);
    setThemeRef.current = setTheme;
    setLanguageRef.current = setLanguage;

    // Helper: update formState AND apply visual changes immediately
    const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setFormState(prev => ({ ...prev, [key]: value }));
        // Apply visual changes right away — no API dependency
        if (key === 'theme') setThemeRef.current(value as string);
        if (key === 'language') setLanguageRef.current(value as 'en' | 'ur');
    }, []);

    // Revert unsaved visual previews when navigating away
    useEffect(() => {
        return () => {
            setThemeRef.current(savedRef.current.theme);
            setLanguageRef.current(savedRef.current.language as 'en' | 'ur');
        };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(formState);
            savedRef.current = formState;
            toast({ title: t.toasts.settingsSaved, description: t.toasts.settingsSavedDesc });
        } catch {
            toast({ title: t.toasts.error, description: t.toasts.settingsError, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        setFormState(savedRef.current);
        setThemeRef.current(savedRef.current.theme);
        setLanguageRef.current(savedRef.current.language as 'en' | 'ur');
        toast({ title: t.toasts.discarded, description: t.toasts.discardedDesc });
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await api.patch('/auth/profile', profileForm);
            updateUser({ name: profileForm.name, phone: profileForm.phone, emergencyContact: profileForm.emergencyContact });
            toast({ title: t.toasts.profileUpdated, description: t.toasts.profileUpdatedDesc });
        } catch (err: any) {
            toast({ title: t.toasts.error, description: err.message || t.toasts.profileError, variant: 'destructive' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({ title: t.toasts.error, description: t.toasts.passwordMismatch, variant: 'destructive' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast({ title: t.toasts.error, description: t.toasts.passwordTooShort, variant: 'destructive' });
            return;
        }
        setSavingPassword(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast({ title: t.toasts.passwordChanged, description: t.toasts.passwordChangedDesc });
        } catch (err: any) {
            toast({ title: t.toasts.error, description: err.message || t.toasts.passwordError, variant: 'destructive' });
        } finally {
            setSavingPassword(false);
        }
    };

    const showGlobalButtons = activeTab !== 'profile' && activeTab !== 'security';

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
    :is(.dark) .slider-round {
        background-color: hsl(155 10% 25%);
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
    :is(.dark) .slider-round:before {
        background-color: hsl(150 10% 80%);
    }
    input:checked + .slider-round {
        background-color: #1a3d35;
    }
    :is(.dark) input:checked + .slider-round {
        background-color: hsl(155 30% 50%);
    }
    input:checked + .slider-round:before {
        transform: translateX(20px);
    }
  `;

    const commonTabs = [
        { id: 'profile' as SettingsTab, label: t.settings.profileTab, icon: User },
        { id: 'notifications' as SettingsTab, label: t.settings.notificationsTab, icon: Bell },
        { id: 'security' as SettingsTab, label: t.settings.securityTab, icon: Lock },
        { id: 'appearance' as SettingsTab, label: t.settings.appearanceTab, icon: Eye },
    ];

    const adminTabs = [
        { id: 'system' as SettingsTab, label: t.settings.systemTab, icon: SettingsIcon },
        { id: 'users' as SettingsTab, label: t.settings.usersTab, icon: Users },
        { id: 'sensors' as SettingsTab, label: t.settings.sensorsTab, icon: Wifi },
    ];

    const tabs = isAdmin ? [...commonTabs, ...adminTabs] : commonTabs;

    return (
        <DashboardLayout role={dashboardRole} userName={user?.name || 'User'} userTitle={roleTitle}>
            <style jsx global>{switchStyles}</style>
            <div className="flex-1 p-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text mb-2">{t.settings.settings}</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isAdmin
                                ? t.settings.adminDesc
                                : t.settings.userDesc
                            }
                        </p>
                    </div>
                    {showGlobalButtons && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleDiscard}
                                className="px-6 py-2 rounded-lg bg-white dark:bg-secondary border border-gray-200 dark:border-border text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-muted transition-colors"
                            >
                                {t.buttons.discard}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg green-gradient text-white text-sm font-bold shadow-lg hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                                {saving ? t.buttons.saving : t.buttons.save}
                            </button>
                        </div>
                    )}
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
                                        : 'bg-white dark:bg-secondary text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-muted border border-gray-200 dark:border-border'
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

                        {/* Profile Tab Content */}
                        {activeTab === 'profile' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    {t.profile.title}
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.profile.fullName}</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.profile.email}</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-gray-50 dark:bg-muted dark:text-foreground text-sm cursor-not-allowed"
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.profile.phone}</label>
                                            <input
                                                className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                type="tel"
                                                placeholder={t.profile.phonePlaceholder}
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.profile.role}</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-gray-50 dark:bg-muted dark:text-foreground text-sm cursor-not-allowed" type="text" value={role || 'User'} disabled />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-primary">{t.profile.emergencyContact}</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                            type="text"
                                            placeholder={t.profile.emergencyPlaceholder}
                                            value={profileForm.emergencyContact}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={savingProfile}
                                            className="px-6 py-2 rounded-lg green-gradient text-white text-sm font-bold shadow-lg hover:opacity-90 transition-colors disabled:opacity-50"
                                        >
                                            {savingProfile ? t.buttons.saving : t.buttons.updateProfile}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Appearance Tab Content */}
                        {activeTab === 'appearance' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    {t.appearance.title}
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.appearance.darkMode}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.appearance.darkModeDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.theme === 'dark'}
                                                onChange={(e) => updateField('theme', e.target.checked ? 'dark' : 'light')}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-primary">{t.appearance.language}</label>
                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                value={formState.language}
                                                onChange={(e) => updateField('language', e.target.value as 'en' | 'ur')}
                                            >
                                                <option value="en">English</option>
                                                <option value="ur">Urdu</option>
                                            </select>
                                            <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#60857d] dark:text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* System Tab Content */}
                        {activeTab === 'system' && isAdmin && (
                            <>
                                <section>
                                    <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                        <Monitor className="w-5 h-5" />
                                        {t.system.title}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.system.commandCenterName}</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder={t.system.commandCenterPlaceholder} type="text" defaultValue="IGNIS Building Complex" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-primary">{t.system.timeZone}</label>
                                            <div className="relative">
                                                <select className="w-full appearance-none px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm">
                                                    <option>Pacific Standard Time (PST)</option>
                                                    <option>Mountain Standard Time (MST)</option>
                                                    <option>Central Standard Time (CST)</option>
                                                    <option>Eastern Standard Time (EST)</option>
                                                </select>
                                                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-[#60857d] dark:text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-primary">{t.system.backupEndpoint}</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" placeholder="https://backup.ignis-command.com/v1" type="text" defaultValue="https://backup.ignis-system.com/v1" />
                                        </div>
                                    </div>
                                </section>
                                <hr className="border-[#d6e1de] dark:border-border" />
                                <section className="border-t-2 border-red-100 dark:border-red-900/30 pt-10">
                                    <h3 className="text-red-700 dark:text-red-400 text-lg font-bold mb-2 uppercase tracking-widest text-[10px]">{t.system.dangerZone}</h3>
                                    <div className="flex items-center justify-between p-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-red-900 dark:text-red-300">{t.system.systemReset}</p>
                                            <p className="text-xs text-red-700 dark:text-red-400">{t.system.systemResetDesc}</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white dark:bg-card border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all">
                                            {t.buttons.purgeSystem}
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Notifications Tab Content */}
                        {activeTab === 'notifications' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    {t.notifications.title}
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.push}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.pushDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.notifyPush}
                                                onChange={(e) => updateField('notifyPush', e.target.checked)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.email}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.emailDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.notifyEmail}
                                                onChange={(e) => updateField('notifyEmail', e.target.checked)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.sms}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.smsDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.notifySms}
                                                onChange={(e) => updateField('notifySms', e.target.checked)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.emergency}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.emergencyDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" disabled />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.maintenance}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.maintenanceDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.notifyMaintenance}
                                                onChange={(e) => updateField('notifyMaintenance', e.target.checked)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.notifications.community}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.notifications.communityDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={formState.notifyCommunity}
                                                onChange={(e) => updateField('notifyCommunity', e.target.checked)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Users Tab Content */}
                        {activeTab === 'users' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    {t.users.title}
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.users.selfRegistration}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.users.selfRegistrationDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.users.emailVerification}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.users.emailVerificationDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.users.twoFactor}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.users.twoFactorDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-primary">{t.users.sessionTimeout}</label>
                                        <input className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" type="number" defaultValue="30" />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* IoT Sensors Tab Content */}
                        {activeTab === 'sensors' && (
                            <section>
                                <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                                    <Gauge className="w-5 h-5" />
                                    {t.sensors.title}
                                </h3>
                                <p className="text-sm text-[#60857d] dark:text-muted-foreground mb-6">{t.sensors.description}</p>
                                <div className="bg-white dark:bg-card border border-[#d6e1de] dark:border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-primary/5 dark:bg-secondary border-b border-[#d6e1de] dark:border-border">
                                                <th className="px-6 py-4 font-bold text-primary">{t.sensors.sensorType}</th>
                                                <th className="px-6 py-4 font-bold text-primary">{t.sensors.threshold}</th>
                                                <th className="px-6 py-4 font-bold text-primary text-right">{t.sensors.lastCalibrated}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#d6e1de] dark:divide-border">
                                            <tr>
                                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                    <Thermometer className="w-5 h-5 text-primary" />
                                                    {t.sensors.thermalCore}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] dark:bg-muted rounded-full appearance-none" type="range" />
                                                    <span className="ml-2 font-bold">145°F</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[#60857d] dark:text-muted-foreground">12h ago</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                    <Wind className="w-5 h-5 text-primary" />
                                                    {t.sensors.particulate}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] dark:bg-muted rounded-full appearance-none" type="range" />
                                                    <span className="ml-2 font-bold">150 μg</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[#60857d] dark:text-muted-foreground">2d ago</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-medium flex items-center gap-2">
                                                    <Wifi className="w-5 h-5 text-primary" />
                                                    {t.sensors.smokeDetector}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input className="w-32 h-1.5 accent-primary bg-[#d6e1de] dark:bg-muted rounded-full appearance-none" type="range" />
                                                    <span className="ml-2 font-bold">0.5%/ft</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-[#60857d] dark:text-muted-foreground">1d ago</td>
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
                                    <Lock className="w-5 h-5" />
                                    {t.security.title}
                                </h3>
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <p className="text-sm font-bold text-primary mb-4">{t.security.changePassword}</p>
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-primary">{t.security.currentPassword}</label>
                                                <input
                                                    className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                    type="password"
                                                    placeholder={t.security.currentPasswordPlaceholder}
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-primary">{t.security.newPassword}</label>
                                                <input
                                                    className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                    type="password"
                                                    placeholder={t.security.newPasswordPlaceholder}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-semibold text-primary">{t.security.confirmPassword}</label>
                                                <input
                                                    className="w-full px-4 py-3 rounded-lg border border-[#d6e1de] dark:border-border bg-white dark:bg-secondary dark:text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                                    type="password"
                                                    placeholder={t.security.confirmPasswordPlaceholder}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                />
                                            </div>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={savingPassword}
                                                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50"
                                            >
                                                {savingPassword ? t.buttons.updating : t.buttons.updatePassword}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.security.twoFactor}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.security.twoFactorDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.security.loginAlerts}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.security.loginAlertsDesc}</p>
                                        </div>
                                        <label className="switch">
                                            <input defaultChecked type="checkbox" />
                                            <span className="slider-round"></span>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-[#d6e1de] dark:border-border">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-primary">{t.security.sessionManagement}</p>
                                            <p className="text-xs text-[#60857d] dark:text-muted-foreground">{t.security.sessionManagementDesc}</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white dark:bg-card border border-[#d6e1de] dark:border-border text-primary rounded-lg text-xs font-bold hover:bg-primary/5 transition-all">
                                            {t.buttons.manageSessions}
                                        </button>
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
        <ProtectedRoute allowedRoles={['management', 'building_authority', 'commander', 'admin', 'firefighter', 'firefighter_hq', 'firefighter_state', 'firefighter_district', 'resident']}>
            <SettingsContent />
        </ProtectedRoute>
    );
}
