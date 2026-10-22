import React from 'react';
import { Sparkles, Settings as SettingsIcon, Volume2, VolumeX, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  pendingTasksCount: number;
  totalNotesCount: number;
  provider: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  isMuted,
  onToggleMute,
  pendingTasksCount,
  totalNotesCount,
  provider
}) => {
  return (
    <header className="h-16 px-4 md:px-6 bg-space-900/80 backdrop-blur-md border-b border-purple-900/30 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 shadow-lg shadow-purple-600/30">
          <Sparkles className="w-5 h-5 text-white" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-space-900 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base md:text-lg bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent tracking-tight">
              AlexaX
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-600/30 to-cyan-500/30 text-purple-300 border border-purple-500/30">
              ALEXA+ AGENT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            MCP Protocol Server Active • Mode: <span className="text-purple-300 uppercase font-semibold">{provider}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Quick summary badges */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="px-3 py-1 bg-space-800/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Tasks: <strong>{pendingTasksCount}</strong> pending</span>
          </div>
          <div className="px-3 py-1 bg-space-800/80 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Notes: <strong>{totalNotesCount}</strong> saved</span>
          </div>
        </div>

        {/* Mute/TTS Toggle button */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Voice speech muted (click to unmute)' : 'Voice speech unmuted (click to mute)'}
          className={`p-2 rounded-xl transition-all border ${
            isMuted
              ? 'bg-space-800 text-slate-400 border-slate-700/60 hover:text-white'
              : 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Settings and API Configuration"
          className="p-2 bg-space-800 hover:bg-space-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/50 transition-all"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
