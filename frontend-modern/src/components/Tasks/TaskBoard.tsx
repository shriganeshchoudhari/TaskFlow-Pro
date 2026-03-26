import React from 'react';
import { DashboardLayout } from '../Dashboard/DashboardLayout';
import { TaskCard } from '../../../.gemini/skills/components/TaskCard';
import { Button } from '../../../.gemini/skills/components/Button';
import { Input } from '../../../.gemini/skills/components/Input';
import { KANBAN_COLUMNS, KANBAN_TASKS } from '../../data/mockData';

export const TaskBoard: React.FC = () => (
  <DashboardLayout>

    {/* Page header */}
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Task Board</h1>
        <p className="text-sm font-sans text-on-surface-variant mt-1">Manage tasks across workflow stages.</p>
      </div>
      <div className="flex items-center gap-3">
        <Input label="" placeholder="Search tasks..." icon="search" className="w-56 py-2.5" />
        <Button variant="primary" icon="add">Add Task</Button>
      </div>
    </div>

    {/* Kanban columns */}
    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = KANBAN_TASKS.filter((t) => t.col === col.key);
        return (
          <div key={col.key} className="flex-shrink-0 w-[320px] flex flex-col gap-3">

            {/* Column header */}
            <div className="flex justify-between items-center px-1 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: col.dot }} />
                <span className="text-xs font-bold font-sans tracking-widest uppercase text-on-surface">{col.label}</span>
                <span className="text-xs bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-medium font-sans">
                  {col.count}
                </span>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
             </div>

            {/* Task cards */}
            <div className="flex flex-col gap-3">
              {colTasks.map((task, i) => (
                <TaskCard
                  key={i}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  dueDate={task.dueDate}
                  overdue={task.overdue}
                  assigneeInitials={task.assigneeInitials}
                />
              ))}

              {/* Empty drop zone */}
              {colTasks.length === 0 && (
                <div className="h-28 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-bright/50 flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-outline-variant">add_box</span>
                  <span className="text-xs font-sans text-on-surface-variant font-medium">Drop tasks here</span>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>

  </DashboardLayout>
);
