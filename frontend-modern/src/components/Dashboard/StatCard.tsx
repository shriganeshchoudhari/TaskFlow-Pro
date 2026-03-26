import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendPositive }) => {
  return (
    <div className="bg-surface-card rounded-xl shadow-ambient p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-container">{icon}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendPositive ? 'text-status-done bg-status-done/10' : 'text-error bg-error/10'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{title}</p>
        <p className="font-display text-3xl font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
};
