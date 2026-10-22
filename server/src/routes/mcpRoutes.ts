import { Router, Request, Response } from 'express';
import { mcpService } from '../mcp/server.js';
import { getToolsList, executeToolDirect, toolsRegistry } from '../mcp/registry.js';

export const mcpRoutes = Router();

// Get status of MCP server
mcpRoutes.get('/status', (req: Request, res: Response) => {
  try {
    const status = mcpService.getStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all MCP tools
mcpRoutes.get('/tools', (req: Request, res: Response) => {
  try {
    const tools = getToolsList();
    res.json({ success: true, count: tools.length, tools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute an MCP tool directly (used by frontend MCP Tool Explorer)
mcpRoutes.post('/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { name, parameters } = req.body;

    if (!name || !toolsRegistry[name]) {
      res.status(404).json({
        success: false,
        error: `Tool "${name}" not found. Available tools: ${Object.keys(toolsRegistry).join(', ')}`
      });
      return;
    }

    const result = await executeToolDirect(name, parameters || {});
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      tool: name,
      parameters: parameters || {},
      result,
      durationMs,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      tool: req.body.name,
      error: err.message,
      durationMs,
      timestamp: new Date().toISOString()
    });
  }
});
