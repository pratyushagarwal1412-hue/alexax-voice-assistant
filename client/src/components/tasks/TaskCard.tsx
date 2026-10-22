import React from 'react';
import { Check, Clock, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDelete
}) => {
  const isCompleted = task.status === 'completed';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 ${
        isCompleted
          ? 'bg-space-900/60 border-slate-800 opacity-75'
          : 'bg-space-850/80 border-purple-500/20 hover:border-purple-500/40 shadow-lg shadow-purple-950/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox button */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
            isCompleted
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white'
              : 'border-slate-600 hover:border-purple-400 bg-space-900'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4
              className={`text-sm font-semibold tracking-wide ${
                isCompleted ? 'line-through text-slate-400' : 'text-white'
              }`}
            >
              {task.title}
            </h4>
            {getPriorityBadge(task.priority)}
          </div>

          {task.description && (
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
            {task.due_date && (
              <span className="flex items-center gap-1 text-purple-300">
                <Calendar className="w-3 h-3" />
                Due: {task.due_date}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Delete action */}
        <button
          type="button"
          onClick={() => onDelete(task.id, task.title)}
          title="Delete task"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
