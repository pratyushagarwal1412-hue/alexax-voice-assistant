import React, { useState } from 'react';
import { Plus, Search, CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface TaskViewProps {
  tasks: Task[];
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
  }) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirmation modal state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: ''
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? task.status === 'pending'
        : task.status === 'completed';

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Summary stats
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'high' && t.status === 'pending').length;

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteConfirmState({
      isOpen: true,
      taskId: id,
      taskTitle: title
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmState.taskId) {
      onDeleteTask(deleteConfirmState.taskId);
    }
    setDeleteConfirmState({ isOpen: false, taskId: '', taskTitle: '' });
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-purple-400" />
            Task Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tasks can be managed manually or seamlessly by asking AlexaX via voice or chat!
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-space-850/80 border border-purple-500/20">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-850/80 border border-amber-500/20">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-850/80 border border-emerald-500/20">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 mt-1">{completedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-space-850/80 border border-red-500/20">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Urgent
          </div>
          <div className="text-2xl font-extrabold text-red-300 mt-1">{highPriorityCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-space-900/60 p-2 rounded-2xl border border-purple-900/20">
        <div className="flex items-center gap-1 bg-space-850 p-1 rounded-xl border border-slate-800">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or details..."
            className="w-full pl-9 pr-4 py-2 bg-space-850 border border-purple-900/30 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-space-900/40 border border-purple-900/20">
            <p className="text-sm text-slate-400">
              No tasks match your current filter or search criteria.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={handleDeleteRequest}
            />
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deleteConfirmState.taskTitle}"? This action is permanent.`}
        confirmText="Delete Task"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmState({ isOpen: false, taskId: '', taskTitle: '' })}
      />
    </div>
  );
};
