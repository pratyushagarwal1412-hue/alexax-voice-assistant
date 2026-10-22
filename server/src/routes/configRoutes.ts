import { Router, Request, Response } from 'express';
import { config } from '../config.js';

export const configRoutes = Router();

configRoutes.get('/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: {
      defaultProvider: config.llmProvider,
      hasGeminiKey: Boolean(config.geminiApiKey),
      hasOpenAiKey: Boolean(config.openaiApiKey),
      mcpServerName: config.mcpServerName,
      mcpServerVersion: config.mcpServerVersion,
      port: config.port
    }
  });
});
