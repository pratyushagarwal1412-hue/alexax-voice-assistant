import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, CheckCircle, Clock, Cloud, Calculator, FileText, CheckSquare } from 'lucide-react';

interface ToolCallBadgeProps {
  toolCall: {
    name: string;
    args: any;
  };
  toolResult?: {
    name: string;
    result: any;
  };
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolCall, toolResult }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'get_current_time':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'calculate':
        return <Calculator className="w-3.5 h-3.5 text-emerald-400" />;
      case 'get_weather':
        return <Cloud className="w-3.5 h-3.5 text-cyan-400" />;
      case 'create_note':
      case 'search_notes':
        return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      case 'manage_tasks':
        return <CheckSquare className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="my-2 rounded-xl bg-space-950/80 border border-purple-500/20 overflow-hidden text-xs transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-space-850/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {getToolIcon(toolCall.name)}
          <span className="font-semibold text-purple-200">
            MCP Tool: <code className="text-cyan-300 font-mono">{toolCall.name}</code>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-2.5 h-2.5" />
            Executed
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 hover:text-white">
          <span className="text-[11px]">{isExpanded ? 'Hide Details' : 'View Payload'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 border-t border-purple-500/20 space-y-2 bg-space-900/60 font-mono text-[11px]">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
              Parameters Input:
            </div>
            <pre className="p-2 rounded-lg bg-black/40 text-purple-200 overflow-x-auto border border-purple-900/30">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {toolResult && (
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                MCP Result Output:
              </div>
              <pre className="p-2 rounded-lg bg-black/40 text-emerald-300 overflow-x-auto border border-emerald-900/30 max-h-48 overflow-y-auto">
                {JSON.stringify(toolResult.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
