import React from 'react';
import { Bot, User, Volume2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { ToolCallBadge } from './ToolCallBadge';

interface MessageItemProps {
  message: ChatMessage;
  onSpeak: (text: string) => void;
  isSpeakingThis: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSpeak,
  isSpeakingThis
}) => {
  const isAssistant = message.sender === 'assistant';

  // Format simple markdown into clean HTML/JSX
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemContent = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-purple-400 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemContent) }} />
          </div>
        );
      }

      // Numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1">
            <span className="text-cyan-400 font-semibold">{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numberedMatch[2]) }} />
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="text-purple-200 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-xs border border-purple-500/20">$1</code>');
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex gap-3 my-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/30 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-2xl p-4 shadow-lg text-sm ${
            isAssistant
              ? 'bg-space-850/90 border border-purple-500/20 text-slate-200 rounded-tl-sm'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-purple-950/40'
          }`}
        >
          {/* Tool Calls execution list */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mb-3">
              {message.tool_calls.map((call, i) => {
                const result = message.tool_results?.[i];
                return <ToolCallBadge key={i} toolCall={call} toolResult={result} />;
              })}
            </div>
          )}

          {/* Main message text */}
          <div className="text-slate-100 text-sm">
            {renderFormattedText(message.text)}
          </div>
        </div>

        {/* Timestamp and action buttons */}
        <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-500">
          <span>{formattedTime}</span>
          {isAssistant && (
            <button
              onClick={() => onSpeak(message.text)}
              title="Speak message aloud"
              className={`flex items-center gap-1 hover:text-purple-300 transition-colors ${
                isSpeakingThis ? 'text-purple-400 font-semibold' : ''
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>{isSpeakingThis ? 'Speaking...' : 'Speak'}</span>
            </button>
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-space-800 border border-purple-500/30 flex items-center justify-center text-purple-300 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
