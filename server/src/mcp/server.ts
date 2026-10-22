import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { config } from '../config.js';
import { registerAllMcpTools, getToolsList, executeToolDirect, toolsRegistry } from './registry.js';

class AlexaXMcpService {
  private mcpServer: McpServer;
  private transports: Map<string, SSEServerTransport> = new Map();
  private isInitialized = false;

  constructor() {
    this.mcpServer = new McpServer({
      name: config.mcpServerName,
      version: config.mcpServerVersion
    });
  }

  public init(): void {
    if (this.isInitialized) return;
    registerAllMcpTools(this.mcpServer);
    this.isInitialized = true;
    console.log(`[MCP Server] Initialized "${config.mcpServerName}" v${config.mcpServerVersion} with ${Object.keys(toolsRegistry).length} tools.`);
  }

  public getMcpServer(): McpServer {
    return this.mcpServer;
  }

  /**
   * Handle incoming SSE connections from MCP clients (e.g. Claude Desktop, MCP Inspector, or custom clients)
   */
  public async handleSseConnect(req: Request, res: Response): Promise<void> {
    try {
      this.init();
      // Transport sends SSE events to client, message endpoint is /mcp/messages
      const transport = new SSEServerTransport('/mcp/messages', res);
      const sessionId = transport.sessionId;
      this.transports.set(sessionId, transport);

      req.on('close', () => {
        console.log(`[MCP Server] SSE client disconnected (sessionId: ${sessionId})`);
        this.transports.delete(sessionId);
      });

      console.log(`[MCP Server] SSE client connected (sessionId: ${sessionId})`);
      await this.mcpServer.connect(transport);
    } catch (error: any) {
      console.error('[MCP Server] Error in SSE connection:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * Handle incoming JSON-RPC POST messages for an active SSE session
   */
  public async handlePostMessage(req: Request, res: Response): Promise<void> {
    const sessionId = (req.query.sessionId as string) || '';
    const transport = this.transports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: `MCP SSE Session not found for sessionId="${sessionId}"` });
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error: any) {
      console.error(`[MCP Server] Error handling post message for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  public getStatus() {
    return {
      status: 'active',
      name: config.mcpServerName,
      version: config.mcpServerVersion,
      activeSseSessions: this.transports.size,
      toolCount: Object.keys(toolsRegistry).length,
      tools: getToolsList()
    };
  }
}

export const mcpService = new AlexaXMcpService();
