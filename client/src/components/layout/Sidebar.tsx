import React from 'react';
import { MessageSquare, CheckSquare, FileText, Cpu, Plus, Trash2 } from 'lucide-react';
import { Conversation } from '../../types';

interface SidebarProps {
  activeTab: 'chat' | 'tasks' | 'notes' | 'mcp';
  setActiveTab: (tab: 'chat' | 'tasks' | 'notes' | 'mcp') => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  pendingTasksCount: number;
  totalNotesCount: number;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  pendingTasksCount,
  totalNotesCount,
  isOpen,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'chat' as const,
      label: 'AI Chat',
      icon: MessageSquare,
      badge: null
    },
    {
      id: 'tasks' as const,
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: FileText,
      badge: totalNotesCount > 0 ? totalNotesCount : null
    },
    {
      id: 'mcp' as const,
      label: 'MCP Tools',
      icon: Cpu,
      badge: '6'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-space-900 border-r border-purple-900/20 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Main Navigation tabs */}
        <div className="p-4 space-y-1.5 border-b border-purple-900/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-space-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-purple-500 text-white'
                        : 'bg-space-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conversations History section (visible in Chat view) */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Conversations
              </span>
              <button
                onClick={onNewConversation}
                title="Start new conversation"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {conversations.length === 0 ? (
                <div className="text-xs text-slate-400 italic px-2 py-4 text-center">
                  No conversation history
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = currentConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-space-800 text-purple-300 border-purple-500/30 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-space-850 border-transparent'
                      }`}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onCloseMobile();
                      }}
                    >
                      <div className="flex items-center gap-2 truncate pr-6">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        title="Delete conversation"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-purple-900/20 mt-auto bg-space-950/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              SQLite Persistent
            </span>
            <span className="text-[11px] text-purple-400/80">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
