import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    { label: "🌤️ Weather in Seattle", prompt: "What is the weather in Seattle?" },
    { label: "🧮 15% tip on $85.50", prompt: "Calculate 15% tip on 85.50" },
    { label: "⏰ Time in Tokyo", prompt: "What time is it in Tokyo?" },
    { label: "📋 Add priority task", prompt: "Add a task to prepare presentation high priority" },
    { label: "📝 Take a quick note", prompt: "Take a note: Meeting tomorrow with team at 10 AM" },
    { label: "📋 Show my tasks", prompt: "What are my pending tasks?" },
  ];

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>Try asking AlexaX:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-space-850 hover:bg-space-800 text-slate-300 hover:text-white border border-purple-900/30 hover:border-purple-500/40 transition-all shadow-sm"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
