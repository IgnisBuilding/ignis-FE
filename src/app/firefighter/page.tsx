'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle } from 'lucide-react';

interface Hazard {
  id: number;
  type: string;
  severity: string;
  status: string;
  description?: string;
  apartment: {
    id: number;
    unit_number: string;
    floor: {
      id: number;
      level: number;
      building: {
        id: number;
        name: string;
        address: string;
      };
    };
  };
  node?: {
    id: number;
  };
  created_at: string;
  updated_at: string;
  responded_at?: string;
  resolved_at?: string;
}

function FirefighterDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'priority'>('all');

  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
      const token = localStorage.getItem('ignis_token');
      // In a real app, this URL should be configurable
      const response = await fetch('http://localhost:7000/hazards/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Fetched active hazards:', JSON.stringify(data, null, 2));
      setHazards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
      // Fallback for demo/dev if API fails
      setHazards([]);
    } finally {
      setLoading(false);
    }
  };

  const activeIncidents = hazards.filter(e => {
    const status = e.status?.toLowerCase();
    return status === 'active' || status === 'reported' || status === 'responding' || status === 'responded';
  });

  const criticalIncident = activeIncidents.find(h => h.severity?.toLowerCase() === 'critical') || activeIncidents[0];
  const feedIncidents = activeIncidents.filter(h => h.id !== criticalIncident?.id);

  // Metrics (Placeholders with real data connection possibilities)
  const personnelOnSite = 148;
  const resourceReady = '94%';
  const avgResponseTime = '4m 12s';

  if (loading) {
    return (
      <DashboardLayout role="firefighter" userName={user?.name || 'Commander'} userTitle="FIREFIGHTER">
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <div className="rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4 animate-spin" />
            <p className="text-xl font-semibold text-primary">Loading Command Center...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="firefighter" userName={user?.name || 'Cmdr. Sterling'} userTitle="SENIOR DIRECTOR">
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Alarms */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Active Alarms</p>
              <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">campaign</span>
            </div>
            <p className="text-4xl font-bold text-primary">{activeIncidents.length}</p>
            <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+2% vs yesterday</span>
            </div>
          </div>

          {/* Personnel On-Site */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Personnel On-Site</p>
              <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">groups</span>
            </div>
            <p className="text-4xl font-bold text-primary">{personnelOnSite}</p>
            <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>-5% current shift</span>
            </div>
          </div>

          {/* Resource Ready */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Resource Ready</p>
              <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">inventory_2</span>
            </div>
            <p className="text-4xl font-bold text-primary">{resourceReady}</p>
            <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+1% optimized</span>
            </div>
          </div>

          {/* Avg Response */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">Avg Response</p>
              <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">timer</span>
            </div>
            <p className="text-4xl font-bold text-primary">{avgResponseTime}</p>
            <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>-12% target efficiency</span>
            </div>
          </div>
        </section>

        {/* Hero Critical Alarm */}
        {criticalIncident ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-primary text-xl font-bold flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500 pulse-red"></span>
                Critical Priority Incident
              </h2>
              <button onClick={() => router.push('/emergency')} className="text-primary text-sm font-bold border-b border-primary">
                View All Incidents
              </button>
            </div>
            <div className="bg-white rounded-3xl p-8 flex flex-col lg:flex-row gap-8 shadow-2xl shadow-primary/10 border border-primary/5">
              <div className="lg:w-1/3 h-64 lg:h-auto bg-slate-200 rounded-2xl relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://placeholder.pics/svg/300')" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 text-sm">location_on</span>
                  <span className="text-xs font-bold text-slate-800">{criticalIncident.apartment?.floor?.building?.name || 'Unknown Location'}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Severity: Critical</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Grade A Response</span>
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-3">
                    {criticalIncident.type || 'Fire Incident'} - {criticalIncident.apartment?.floor?.building?.name}
                  </h3>
                  <p className="text-slate-500 leading-relaxed max-w-2xl mb-6">
                    {criticalIncident.description || `Reported at Floor ${criticalIncident.apartment?.floor?.level}, Unit ${criticalIncident.apartment?.unit_number}. Immediate response required.`}
                    <br />
                    <span className="font-bold text-primary">Units Assigned: Engine 42, Truck 18, Rescue 09.</span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 border-r border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Elapsed</p>
                      <p className="text-lg font-bold text-primary tracking-tighter">08:42</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Backup ETA</p>
                      <p className="text-lg font-bold text-primary tracking-tighter">03m 15s</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full flex gap-3">
                    <button
                      onClick={() => router.push(`/emergency/${criticalIncident.apartment?.floor?.building?.id}`)}
                      className="flex-1 bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                    >
                      <span className="material-symbols-outlined">radiology</span>
                      Respond to Incident
                    </button>
                    <button className="bg-primary/5 text-primary font-bold px-6 rounded-xl hover:bg-primary/10 transition-all">
                      <span className="material-symbols-outlined">share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl shadow-primary/10 border border-primary/5">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-3">All Clear</h3>
              <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                No active incidents at this time. All systems operational and monitoring.
              </p>
            </div>
          </section>
        )}

        {/* Active Feed */}
        {activeIncidents.length > 0 && (
          <section className="pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-primary text-xl font-bold uppercase tracking-tight">Active Incident Feed</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${feedFilter === 'all' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  All Units
                </button>
                <button
                  onClick={() => setFeedFilter('priority')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${feedFilter === 'priority' ? 'bg-primary/5 text-primary border-primary/10' : 'bg-white text-slate-400 border-slate-100'}`}
                >
                  Priority Only
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-primary/5 bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary/5 border-b border-primary/5">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-primary uppercase tracking-widest">ID / Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-primary uppercase tracking-widest">Incident Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-primary uppercase tracking-widest">Resources</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-primary uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-primary uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-400">#{incident.id}</span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                            <span className="size-1.5 rounded-full bg-orange-600"></span> {incident.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary text-sm">{incident.type}</p>
                        <p className="text-xs text-slate-500">{incident.apartment?.floor?.building?.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          <div className="size-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">U1</div>
                          <div className="size-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">+2</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600">--:--</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-primary/70 material-symbols-outlined">more_vert</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function FirefighterDashboard() {
  return (
    <ProtectedRoute allowedRoles={['firefighter']}>
      <FirefighterDashboardContent />
    </ProtectedRoute>
  );
}
