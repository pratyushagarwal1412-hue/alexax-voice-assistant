import React, { useState, useRef } from 'react';
import { Send, Mic, AlertCircle } from 'lucide-react';
import { speechService } from '../../services/speech';

interface VoiceInputBarProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  autoSpeak: boolean;
}

export const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  onSendMessage,
  isLoading,
  isListening,
  setIsListening,
}) => {
  const [inputText, setInputText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSpeechSupported = speechService.isSpeechRecognitionSupported();

  const handleToggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      setSpeechError(null);
      const started = speechService.startListening(
        (transcript, isFinal) => {
          setInterimTranscript(transcript);
          if (isFinal && transcript.trim()) {
            setInputText(transcript);
            setInterimTranscript('');
            setIsListening(false);
            // Auto send after speech finishes
            setTimeout(() => {
              onSendMessage(transcript);
              setInputText('');
            }, 300);
          }
        },
        (error) => {
          setSpeechError(error);
          setIsListening(false);
          setInterimTranscript('');
        },
        () => {
          setIsListening(false);
          setInterimTranscript('');
        }
      );

      if (started) {
        setIsListening(true);
      }
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    onSendMessage(inputText.trim());
    setInputText('');
    setInterimTranscript('');
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative pt-2">
      {/* Real-time transcript banner when speaking */}
      {isListening && (
        <div className="mb-2 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="italic truncate">
              {interimTranscript || 'Listening for your voice... speak now!'}
            </span>
          </div>
          <button
            onClick={() => {
              speechService.stopListening();
              setIsListening(false);
            }}
            className="text-[11px] underline text-cyan-300 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Speech error notification */}
      {speechError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="flex-1">{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="text-[11px] text-red-300 hover:text-white ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main input container */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2">
        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          title={
            !isSpeechSupported
              ? 'Voice recognition not supported in this browser'
              : isListening
              ? 'Click to stop listening'
              : 'Click to speak'
          }
          disabled={!isSpeechSupported}
          className={`relative p-3 rounded-2xl flex items-center justify-center transition-all ${
            !isSpeechSupported
              ? 'bg-space-850 text-slate-600 cursor-not-allowed border border-slate-800'
              : isListening
              ? 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/40 animate-pulse border border-cyan-400'
              : 'bg-space-800 hover:bg-space-700 text-purple-300 hover:text-white border border-purple-500/30 shadow-md shadow-purple-950/30'
          }`}
        >
          {isListening ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-4 bg-white rounded-full animate-bounce" />
              <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speech...'
                : 'Ask AlexaX anything or click the microphone to speak...'
            }
            disabled={isLoading}
            className="w-full px-4 py-3 bg-space-850 border border-purple-900/30 focus:border-purple-500/60 rounded-2xl text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-inner transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          title="Send message"
          className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-md shadow-purple-950/40 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
