import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { getDb } from './db/index.js';
import { seedInitialDataIfNeeded } from './db/seed.js';
import { mcpService } from './mcp/server.js';
import { chatRoutes } from './routes/chatRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { noteRoutes } from './routes/noteRoutes.js';
import { mcpRoutes } from './routes/mcpRoutes.js';
import { configRoutes } from './routes/configRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize SQLite Database and Seed data
try {
  getDb();
  seedInitialDataIfNeeded();
} catch (err) {
  console.error('[Startup] Error initializing database:', err);
}

// Initialize MCP Server
mcpService.init();

// --- MCP SSE Protocol Endpoints ---
// Clients can connect via Server-Sent Events to interact with tools using the MCP specification
app.get('/mcp/sse', (req: Request, res: Response) => {
  mcpService.handleSseConnect(req, res);
});

app.post('/mcp/messages', (req: Request, res: Response) => {
  mcpService.handlePostMessage(req, res);
});

// --- REST API Endpoints ---
app.use('/api', chatRoutes);
app.use('/api', taskRoutes);
app.use('/api', noteRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api', configRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AlexaX Voice Assistant Backend & MCP Server',
    version: '1.0.0'
  });
});

// Serve frontend static build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response) => {
    // If it's an API route or MCP route, don't return index.html
    if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) {
      res.status(404).json({ error: 'Endpoint not found' });
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server
app.listen(config.port, config.host, () => {
  console.log('='.repeat(60));
  console.log(`🚀 AlexaX Assistant Server running on http://${config.host}:${config.port}`);
  console.log(`🤖 LLM Provider: ${config.llmProvider.toUpperCase()}`);
  console.log(`📡 MCP SSE Endpoint: http://${config.host}:${config.port}/mcp/sse`);
  console.log(`🛠️  MCP Tools Endpoint: http://${config.host}:${config.port}/api/mcp/tools`);
  console.log(`💬 Chat API: http://${config.host}:${config.port}/api/chat`);
  console.log('='.repeat(60));
});

export default app;
