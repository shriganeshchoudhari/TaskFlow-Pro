import React from 'react';
import { NavItem } from '../../../.gemini/skills/components/NavItem';
import { Avatar } from '../../../.gemini/skills/components/Avatar';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS, CURRENT_USER } from '../../data/mockData';

export const Sidebar: React.FC = () => (
  <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface-container-low z-20">

    {/* Logo */}
    <div className="h-16 flex items-center px-6 gap-2.5">
      <span
        className="material-symbols-outlined text-primary-container text-2xl"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        task_alt
      </span>
      <span className="font-display text-lg font-bold text-on-surface tracking-tight">TaskFlow Pro</span>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>

    {/* Footer */}
    <div className="px-3 py-4 space-y-1">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
      <div className="mt-3 px-3 py-2 flex items-center gap-3">
        <Avatar initials={CURRENT_USER.initials} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-sans text-on-surface truncate">{CURRENT_USER.name}</p>
          <p className="text-xs font-sans text-on-surface-variant truncate">{CURRENT_USER.email}</p>
        </div>
      </div>
    </div>

  </aside>
);
