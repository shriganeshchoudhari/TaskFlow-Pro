import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col relative w-full">
        <Header />
        <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 md:px-12 pt-12 pb-32">
          {children}
        </main>
      </div>
    </div>
  );
};
