import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}: MetricCardProps) {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-primary/60 text-sm font-semibold uppercase tracking-wider">{title}</p>
        <span className="text-primary bg-primary/5 p-2 rounded-lg">
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <p className="text-4xl font-bold text-primary">{value}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{trend.value}</span>
        </div>
      )}
      {subtitle && (
        <p className="text-sm text-primary/60">{subtitle}</p>
      )}
    </div>
  );
}
