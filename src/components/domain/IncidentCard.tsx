interface IncidentCardProps {
  incident: {
    id: number;
    type: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    location: string;
    building: string;
    sector: string;
    elapsed_time: string;
    backup_eta: string;
    units_assigned: string;
    status: string;
    created_at: string;
  };
  onRespond?: (id: number) => void;
  onResolve?: (id: number) => void;
}

export function IncidentCard({ incident, onRespond, onResolve }: IncidentCardProps) {
  const severityBadgeColors = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white dark:bg-card rounded-3xl border border-primary/5 dark:border-border overflow-hidden hover:shadow-2xl transition-all duration-200 shadow-xl shadow-primary/10">
      <div className="flex flex-col lg:flex-row gap-8 p-8">
        {/* Image Section */}
        <div className="lg:w-1/3 h-64 lg:h-auto bg-primary/10 rounded-2xl overflow-hidden relative flex items-center justify-center">
          <svg className="w-24 h-24 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-card/90 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold text-slate-800 dark:text-foreground">{incident.sector}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between py-2">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${severityBadgeColors[incident.severity]}`}>
                SEVERITY: {incident.severity === "Critical" ? "EXTREME" : incident.severity.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-700">
                GRADE A RESPONSE
              </span>
            </div>
            <h3 className="text-3xl font-bold text-primary mb-3">{incident.type}</h3>
            <p className="text-slate-500 dark:text-muted-foreground leading-relaxed max-w-2xl mb-6">
              {incident.description} <span className="font-bold text-primary">{incident.units_assigned}</span>
            </p>
          </div>

          {/* Time and Action Section */}
          <div className="flex flex-col md:flex-row items-center gap-8 border-t border-slate-100 dark:border-border pt-6">
            <div className="flex items-center gap-4">
              <div className="text-center px-4 border-r border-slate-100 dark:border-border">
                <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-bold uppercase mb-1">ELAPSED</p>
                <p className="text-lg font-bold text-primary tracking-tighter">{incident.elapsed_time}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-bold uppercase mb-1">BACKUP ETA</p>
                <p className="text-lg font-bold text-primary tracking-tighter">{incident.backup_eta}</p>
              </div>
            </div>

            <div className="flex-1 w-full flex gap-3">
              {(incident.status === "Active" || incident.status === "Reported") && onRespond && (
                <button
                  onClick={() => onRespond(incident.id)}
                  className="flex-1 bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Respond to Incident
                </button>
              )}
              {(incident.status === "Responding" || incident.status === "Responded") && onResolve && (
                <button
                  onClick={() => onResolve(incident.id)}
                  className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-600/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Resolved
                </button>
              )}
              <button className="bg-primary/5 text-primary font-bold px-6 rounded-xl hover:bg-primary/10 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
