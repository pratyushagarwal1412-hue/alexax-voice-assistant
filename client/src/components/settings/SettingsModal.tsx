import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Volume2, Key, Cpu, Play } from 'lucide-react';
import { Settings } from '../../types';
import { speechService } from '../../services/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [provider, setProvider] = useState<'mock' | 'gemini' | 'openai'>(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak);
  const [voiceIndex, setVoiceIndex] = useState(settings.voiceIndex || 0);
  const [speechRate, setSpeechRate] = useState(settings.speechRate || 1.0);
  const [speechPitch, setSpeechPitch] = useState(settings.speechPitch || 1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider);
      setApiKey(settings.apiKey || '');
      setAutoSpeak(settings.autoSpeak);
      setVoiceIndex(settings.voiceIndex || 0);
      setSpeechRate(settings.speechRate || 1.0);
      setSpeechPitch(settings.speechPitch || 1.0);

      const voices = speechService.getVoices();
      setAvailableVoices(voices);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    speechService.speak(
      'Hello! I am AlexaX, your personal AI agent powered by Model Context Protocol.',
      {
        voiceIndex,
        rate: speechRate,
        pitch: speechPitch
      }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      provider,
      apiKey: apiKey.trim(),
      autoSpeak,
      voiceIndex,
      speechRate,
      speechPitch
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-space-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assistant Settings</h3>
              <p className="text-xs text-slate-400">Configure LLM providers and voice synthesis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-space-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              AI Intelligence Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mock', name: 'Demo Engine', desc: 'No API Key' },
                { id: 'gemini', name: 'Google Gemini', desc: 'Cloud LLM' },
                { id: 'openai', name: 'OpenAI GPT', desc: 'Cloud LLM' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === p.id
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                      : 'bg-space-850 border-purple-900/20 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{p.name}</div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>

            {/* API Key input if not mock */}
            {provider !== 'mock' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  {provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${provider === 'gemini' ? 'AIza...' : 'sk-...'} key (optional if set on server)`}
                  className="w-full px-3.5 py-2.5 bg-space-850 border border-purple-900/30 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to use the server environment variable, or use Demo Engine which works offline without any key.
                </p>
              </div>
            )}
          </div>

          {/* Voice & Speech Synthesis */}
          <div className="space-y-4 pt-4 border-t border-purple-900/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                Text-to-Speech (TTS)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Auto-speak responses</span>
              </label>
            </div>

            {/* Voice select */}
            {availableVoices.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Voice</label>
                <select
                  value={voiceIndex}
                  onChange={(e) => setVoiceIndex(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-space-850 border border-purple-900/30 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  {availableVoices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speech rate slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Speed / Rate</span>
                <span>{speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Speech pitch slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Pitch</span>
                <span>{speechPitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-space-850 hover:bg-space-800 text-purple-300 hover:text-white rounded-xl text-xs font-medium border border-purple-900/30 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Test Voice Output</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-900/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-space-800 rounded-xl border border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-950/40"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
