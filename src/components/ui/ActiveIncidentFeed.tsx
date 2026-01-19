'use client';
import { MoreVertical } from 'lucide-react';

export type IncidentStatus = 'en_route' | 'staged' | 'clearing' | 'responding' | 'active' | 'reported';

export interface IncidentFeedItem {
  id: string;
  status: IncidentStatus;
  title: string;
  description: string;
  resources: string[];
  duration: string;
  onAction?: () => void;
}

interface ActiveIncidentFeedProps {
  incidents: IncidentFeedItem[];
  filter?: 'all' | 'priority';
  onFilterChange?: (filter: 'all' | 'priority') => void;
}

const statusConfig: Record<IncidentStatus, { label: string; color: string; dotColor: string }> = {
  en_route: { label: 'EN ROUTE', color: 'text-orange-600', dotColor: 'bg-orange-600' },
  staged: { label: 'STAGED', color: 'text-green-600', dotColor: 'bg-green-600' },
  clearing: { label: 'CLEARING', color: 'text-blue-600', dotColor: 'bg-blue-600' },
  responding: { label: 'RESPONDING', color: 'text-yellow-600', dotColor: 'bg-yellow-600' },
  active: { label: 'ACTIVE', color: 'text-red-600', dotColor: 'bg-red-600' },
  reported: { label: 'REPORTED', color: 'text-purple-600', dotColor: 'bg-purple-600' },
};

export function ActiveIncidentFeed({
  incidents,
  filter = 'all',
  onFilterChange,
}: ActiveIncidentFeedProps) {
  return (
    <section className="pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-primary text-xl font-bold uppercase tracking-tight">Active Incident Feed</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange?.('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              filter === 'all'
                ? 'bg-primary/5 text-primary border-primary/10'
                : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
            All Units
          </button>
          <button
            onClick={() => onFilterChange?.('priority')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              filter === 'priority'
                ? 'bg-primary/5 text-primary border-primary/10'
                : 'bg-white text-slate-400 border-slate-100'
            }`}
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
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No active incidents
                </td>
              </tr>
            ) : (
              incidents.map((incident) => {
                const status = statusConfig[incident.status];
                return (
                  <tr key={incident.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400">#{incident.id}</span>
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary text-sm">{incident.title}</p>
                      <p className="text-xs text-slate-500">{incident.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {incident.resources.slice(0, 2).map((resource, idx) => (
                          <div
                            key={idx}
                            className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                          >
                            {resource}
                          </div>
                        ))}
                        {incident.resources.length > 2 && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                            +{incident.resources.length - 2}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{incident.duration}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={incident.onAction}
                        className="text-primary hover:text-primary/70 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
