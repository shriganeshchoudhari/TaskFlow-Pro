import React from 'react';
import { Avatar } from '../../../.gemini/skills/components/Avatar';
import { CURRENT_USER } from '../../data/mockData';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all px-6 md:px-12 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors p-2 -ml-2">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative hidden sm:block max-w-sm w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search tasks, projects..."
            className="w-full bg-surface-container-highest border-none py-3 pl-12 pr-4 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container transition-all font-sans"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-slate-100/50 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <div className="h-10 w-10 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center ring-2 ring-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
          <Avatar initials={CURRENT_USER.initials} size="md" />
        </div>
      </div>
    </header>
  );
};
