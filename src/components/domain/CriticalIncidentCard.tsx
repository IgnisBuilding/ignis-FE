'use client';
import { MapPin, Share2, Radio } from 'lucide-react';

interface CriticalIncidentProps {
  id: number;
  title: string;
  description: string;
  location: {
    building: string;
    address: string;
    sector?: string;
  };
  severity: 'extreme' | 'high' | 'medium' | 'low';
  responseGrade?: string;
  unitsAssigned?: string[];
  elapsedTime: string;
  backupEta?: string;
  onRespond?: () => void;
  onShare?: () => void;
}

export function CriticalIncidentCard({
  title,
  description,
  location,
  severity,
  responseGrade,
  unitsAssigned = [],
  elapsedTime,
  backupEta,
  onRespond,
  onShare,
}: CriticalIncidentProps) {
  const severityColors = {
    extreme: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white dark:bg-card rounded-3xl p-8 flex flex-col lg:flex-row gap-8 shadow-2xl shadow-primary/10 border border-primary/5 dark:border-border">
      {/* Map Image Section */}
      <div className="lg:w-1/3 h-64 lg:h-auto bg-gradient-to-br from-slate-300 to-slate-400 dark:from-muted dark:to-muted bg-cover bg-center rounded-2xl relative overflow-hidden min-h-[250px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-card/90 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-foreground">{location.sector || location.building}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between py-2">
        <div>
          {/* Severity Badges */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`px-3 py-1 ${severityColors[severity]} text-[10px] font-bold uppercase tracking-widest rounded-full`}>
              Severity: {severity}
            </span>
            {responseGrade && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                {responseGrade}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-3xl font-bold text-primary mb-3">{title}</h3>

          {/* Description */}
          <p className="text-slate-500 dark:text-muted-foreground leading-relaxed max-w-2xl mb-6">
            {description}
            {unitsAssigned.length > 0 && (
              <span className="font-bold text-primary"> Units Assigned: {unitsAssigned.join(', ')}.</span>
            )}
          </p>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 border-t border-slate-100 dark:border-border pt-6">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 border-r border-slate-100 dark:border-border">
              <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-bold uppercase mb-1">Elapsed</p>
              <p className="text-lg font-bold text-primary tracking-tighter">{elapsedTime}</p>
            </div>
            {backupEta && (
              <div className="text-center px-4">
                <p className="text-[10px] text-slate-400 dark:text-muted-foreground font-bold uppercase mb-1">Backup ETA</p>
                <p className="text-lg font-bold text-primary tracking-tighter">{backupEta}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-1 w-full flex gap-3">
            <button
              onClick={onRespond}
              className="flex-1 bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <Radio className="w-5 h-5" />
              Respond to Incident
            </button>
            <button
              onClick={onShare}
              className="bg-primary/5 text-primary font-bold px-6 rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
