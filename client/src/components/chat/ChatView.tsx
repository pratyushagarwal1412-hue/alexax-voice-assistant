import React, { useRef, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { MessageItem } from './MessageItem';
import { SuggestedPrompts } from './SuggestedPrompts';
import { VoiceInputBar } from './VoiceInputBar';
import { VoiceVisualizer } from '../layout/VoiceVisualizer';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isSpeaking: boolean;
  onToggleMic: () => void;
  onSpeakText: (text: string) => void;
  currentlySpeakingText: string | null;
  autoSpeak: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  isListening,
  setIsListening,
  isSpeaking,
  onToggleMic,
  onSpeakText,
  currentlySpeakingText,
  autoSpeak
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-6 py-4">
      {/* Central Visualizer section */}
      <div className="flex-shrink-0 mb-2">
        <VoiceVisualizer
          isListening={isListening}
          isSpeaking={isSpeaking}
          onToggleMic={onToggleMic}
        />
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-xl">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Start talking to AlexaX
            </h3>
            <p className="text-sm max-w-md text-slate-400 leading-relaxed">
              Use voice or text to check weather, evaluate calculations, manage your tasks, create notes, and explore MCP tools.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSpeak={onSpeakText}
              isSpeakingThis={isSpeaking && currentlySpeakingText === msg.text}
            />
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 my-4">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-space-850/80 border border-purple-500/20 text-slate-300 text-xs flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>AlexaX is executing MCP tools and thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      <div className="flex-shrink-0 pt-2 border-t border-purple-900/20">
        <SuggestedPrompts onSelectPrompt={onSendMessage} />
      </div>

      {/* Voice & Text Input Bar */}
      <div className="flex-shrink-0">
        <VoiceInputBar
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          isListening={isListening}
          setIsListening={setIsListening}
          autoSpeak={autoSpeak}
        />
      </div>
    </div>
  );
};
