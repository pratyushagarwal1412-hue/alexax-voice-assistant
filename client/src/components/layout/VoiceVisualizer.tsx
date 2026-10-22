import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
  statusText?: string;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  onToggleMic,
  statusText
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-3">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing aura */}
        <div
          className={`absolute rounded-full filter blur-xl transition-all duration-700 pointer-events-none ${
            isListening
              ? 'w-36 h-36 bg-cyan-500/30 animate-pulse'
              : isSpeaking
              ? 'w-36 h-36 bg-purple-500/30 animate-pulse'
              : 'w-24 h-24 bg-indigo-500/10'
          }`}
        />

        {/* Dynamic Waveform rings when active */}
        {isListening && (
          <div className="absolute inset-0 -m-3 rounded-full border-2 border-cyan-400/40 animate-ping pointer-events-none" />
        )}
        {isSpeaking && (
          <div className="absolute inset-0 -m-3 rounded-full border-2 border-purple-400/40 animate-ping pointer-events-none" />
        )}

        {/* Central interactive orb button */}
        <button
          onClick={onToggleMic}
          title={isListening ? 'Stop listening' : 'Start voice input'}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-500 border-cyan-300 scale-105 shadow-cyan-500/50'
              : isSpeaking
              ? 'bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-600 border-purple-300 scale-105 shadow-purple-500/50'
              : 'bg-gradient-to-tr from-space-850 via-space-800 to-purple-950/60 border-purple-500/30 hover:border-purple-400 hover:scale-105 shadow-purple-900/30'
          }`}
        >
          {isListening ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-6 bg-white rounded-full animate-[soundWave_0.6s_ease-in-out_infinite_alternate]" />
              <span className="w-1.5 h-9 bg-white rounded-full animate-[soundWave_0.8s_ease-in-out_infinite_alternate_0.2s]" />
              <span className="w-1.5 h-5 bg-white rounded-full animate-[soundWave_0.5s_ease-in-out_infinite_alternate_0.4s]" />
            </div>
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <Mic className="w-8 h-8 text-purple-300 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Voice Status Pill */}
      <div className="mt-3 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide border transition-all ${
            isListening
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 animate-pulse'
              : isSpeaking
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              : 'bg-space-800 text-slate-400 border-slate-700/50'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isListening
                ? 'bg-cyan-400 animate-ping'
                : isSpeaking
                ? 'bg-purple-400 animate-ping'
                : 'bg-slate-500'
            }`}
          />
          {statusText || (isListening ? 'Listening...' : isSpeaking ? 'AlexaX is speaking...' : 'Ready for voice input')}
        </span>
      </div>
    </div>
  );
};
