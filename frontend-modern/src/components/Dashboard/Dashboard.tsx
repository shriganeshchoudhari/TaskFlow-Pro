import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { StatCard } from '../../../.gemini/skills/components/StatCard';
import { DASHBOARD_STATS, ACTIVE_TASKS, RECENT_ACTIVITY, CURRENT_USER } from '../../data/mockData';

export const Dashboard: React.FC = () => (
  <DashboardLayout>
    
    {/* Page heading */}
    <section className="mb-16 mt-4">
      <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-on-surface mb-4">
        Dashboard
      </h2>
      <p className="text-lg text-on-surface-variant max-w-2xl font-body leading-relaxed">
        Welcome back, {CURRENT_USER.name.split(' ')[0]}. You have <span className="text-primary font-semibold">{ACTIVE_TASKS.length} active tasks</span> across 4 projects requiring your attention today.
      </p>
    </section>

    {/* Stats row */}
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-20">
      {DASHBOARD_STATS.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </section>

    {/* Content grid - Asymmetrical */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

      {/* Active tasks table */}
      <section className="lg:col-span-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-display font-bold">Active Tasks</h3>
          <button className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="space-y-4">
          {ACTIVE_TASKS.map((t, i) => {
            const isProgress = t.status === 'in_progress';
            const isReview = t.status === 'review';

            let pillClass = 'bg-surface-container-highest text-on-surface';
            let labelProps = 'To Do';
            if (t.status === 'todo') { labelProps = 'To Do'; pillClass = 'bg-surface-container-highest text-on-surface'; }
            if (isProgress) { labelProps = 'In Progress'; pillClass = 'bg-primary-fixed text-on-primary-fixed'; }
            if (isReview) { labelProps = 'Review'; pillClass = 'bg-orange-100 text-orange-800'; }
            if (t.status === 'done') { labelProps = 'Done'; pillClass = 'bg-green-100 text-green-800'; }

            const iconOpts = [
              { icon: 'architecture', color: 'bg-primary-container/10 text-primary' },
              { icon: 'database', color: 'bg-tertiary-fixed/30 text-tertiary' },
              { icon: 'campaign', color: 'bg-green-50 text-green-700' }
            ];
            const opt = iconOpts[i % iconOpts.length];

            return (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-[24px] shadow-ambient-md flex items-center justify-between transition-all hover:scale-[1.01] duration-300">
                <div className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${opt.color}`}>
                    <span className="material-symbols-outlined">{opt.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-on-surface font-sans">{t.title}</h4>
                    <p className="text-sm text-outline font-sans mt-1">Project: {t.project} • Due: {t.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className={`hidden md:flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${pillClass}`}>
                    {labelProps}
                  </span>
                  <span className="material-symbols-outlined text-outline cursor-pointer hover:text-on-surface">more_vert</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity feed */}
      <section className="lg:col-span-4">
        <h3 className="text-2xl font-display font-bold mb-8">Activity Feed</h3>
        <div className="relative pl-8 space-y-12">
          {/* Vertical Line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-outline-variant opacity-30"></div>
          
          {RECENT_ACTIVITY.map((ev, i) => (
            <div key={i} className="relative">
              <div className={`absolute -left-[29px] top-1 h-5 w-5 rounded-full ring-4 ring-surface flex items-center justify-center ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`}>
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface font-sans">
                  {ev.name} <span className="font-normal text-on-surface-variant font-sans">{ev.action}</span> {ev.task}
                </p>
                <p className="text-xs text-outline mt-1 font-sans">{ev.time}</p>
                {i === 0 && (
                  <div className="mt-3 p-4 bg-surface-container-low rounded-2xl text-sm italic text-on-surface-variant font-sans">
                    "Awesome work on this component!"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
    
    {/* Contextual FAB */}
    <button className="fixed right-6 bottom-12 h-16 w-16 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-2xl shadow-ambient-glow flex items-center justify-center hover:scale-105 transition-transform duration-200 active:scale-95 group z-40">
      <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
    </button>
  </DashboardLayout>
);
