import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle, AlertCircle, Clock, Sparkles, Terminal, RefreshCw } from 'lucide-react';
import { McpTool } from '../../types';
import { api } from '../../services/api';

interface McpExplorerViewProps {
  tools: McpTool[];
}

export const McpExplorerView: React.FC<McpExplorerViewProps> = ({ tools }) => {
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [inputJson, setInputJson] = useState('{}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<any | null>(null);

  // Set default selected tool
  useEffect(() => {
    if (tools.length > 0 && !selectedTool) {
      handleSelectTool(tools[0]);
    }
  }, [tools]);

  // Fetch live server status
  const loadStatus = async () => {
    try {
      const status = await api.getMcpStatus();
      setServerStatus(status);
    } catch (err) {
      console.warn('Could not fetch MCP status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const getSamplePayload = (name: string): string => {
    switch (name) {
      case 'get_current_time':
        return JSON.stringify({ timezone: 'Asia/Tokyo' }, null, 2);
      case 'calculate':
        return JSON.stringify({ expression: '15% of 85.50 + 20' }, null, 2);
      case 'get_weather':
        return JSON.stringify({ city: 'San Francisco', units: 'celsius' }, null, 2);
      case 'create_note':
        return JSON.stringify({
          title: 'MCP Explorer Test Note',
          content: 'This note was created via the interactive MCP tool runner.',
          tags: ['mcp', 'explorer', 'test']
        }, null, 2);
      case 'search_notes':
        return JSON.stringify({ query: 'architecture' }, null, 2);
      case 'manage_tasks':
        return JSON.stringify({
          action: 'create',
          title: 'Review MCP tools implementation',
          priority: 'high',
          description: 'Tested via MCP Explorer runner'
        }, null, 2);
      default:
        return '{}';
    }
  };

  const handleSelectTool = (tool: McpTool) => {
    setSelectedTool(tool);
    setInputJson(getSamplePayload(tool.name));
    setExecutionResult(null);
    setExecutionError(null);
    setExecutionDuration(null);
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);
    setExecutionDuration(null);

    let parsedParams = {};
    try {
      parsedParams = JSON.parse(inputJson);
    } catch (err: any) {
      setExecutionError(`Invalid JSON in parameters: ${err.message}`);
      setIsExecuting(false);
      return;
    }

    try {
      const response = await api.executeMcpTool(selectedTool.name, parsedParams);
      setExecutionResult(response.result);
      setExecutionDuration(response.durationMs);
    } catch (err: any) {
      setExecutionError(err.message || 'Error executing MCP tool.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            Model Context Protocol (MCP) Explorer
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Test and inspect self-hosted MCP tools live with the official TypeScript SDK.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="flex items-center gap-2 px-3 py-2 bg-space-850 hover:bg-space-800 text-slate-300 hover:text-white rounded-xl border border-purple-900/30 text-xs font-medium self-start sm:self-auto transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          <span>Refresh MCP Status</span>
        </button>
      </div>

      {/* MCP Protocol Live Server Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-space-900 to-space-850 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {serverStatus?.name || 'alexax-mcp-server'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Transport: <span className="text-cyan-300">SSE (/mcp/sse)</span> • Tools: <span className="text-purple-300">{tools.length} Registered</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SDK: @modelcontextprotocol/sdk v1.32.1</span>
        </div>
      </div>

      {/* Tools Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Tools List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Registered MCP Tools ({tools.length})
          </div>

          <div className="space-y-2">
            {tools.map((tool) => {
              const isSelected = selectedTool?.name === tool.name;
              return (
                <div
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-space-850 border-purple-500/60 shadow-lg shadow-purple-950/40'
                      : 'bg-space-900/60 border-purple-900/20 hover:border-purple-500/30 hover:bg-space-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-bold text-purple-300">
                      {tool.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
                      TOOL
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Tool Runner & Schema Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTool ? (
            <div className="p-6 rounded-2xl bg-space-850/90 border border-purple-500/30 shadow-2xl shadow-purple-950/30 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    {selectedTool.name}
                  </h3>
                  <button
                    onClick={() => setInputJson(getSamplePayload(selectedTool.name))}
                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Reset Sample Input
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>

              {/* Parameter Schema preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Input JSON Schema:
                </label>
                <pre className="p-3 rounded-xl bg-black/40 border border-purple-900/30 text-[11px] font-mono text-purple-300 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedTool.inputSchema, null, 2)}
                </pre>
              </div>

              {/* Editable Input Parameters */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Parameters (JSON):
                </label>
                <textarea
                  rows={5}
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  className="w-full p-3 bg-black/50 border border-purple-900/40 focus:border-purple-500 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none leading-relaxed"
                />
              </div>

              {/* Execution Trigger */}
              <button
                type="button"
                onClick={handleRunTool}
                disabled={isExecuting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing via MCP Server...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Execute Tool ({selectedTool.name})</span>
                  </>
                )}
              </button>

              {/* Error Output */}
              {executionError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="font-mono">{executionError}</span>
                </div>
              )}

              {/* Execution Result */}
              {executionResult && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Execution Succeeded
                    </span>
                    {executionDuration !== null && (
                      <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        Latency: {executionDuration} ms
                      </span>
                    )}
                  </div>
                  <pre className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-space-900/40 border border-purple-900/20 text-slate-400">
              Select a tool on the left to inspect its schema and execute it live.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
