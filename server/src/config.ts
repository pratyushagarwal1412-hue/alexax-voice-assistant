import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'mock') as 'mock' | 'gemini' | 'openai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const DATA_DIR = process.env.DATA_DIR 
  ? path.resolve(process.env.DATA_DIR) 
  : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In test environment, isolate DB per process
const isTest = process.env.NODE_ENV === 'test';
const dbFileName = isTest ? `alexax_test_${process.pid}.db` : 'alexax.db';
const DB_PATH = path.join(DATA_DIR, dbFileName);

export const config = {
  port: PORT,
  host: HOST,
  llmProvider: LLM_PROVIDER,
  geminiApiKey: GEMINI_API_KEY,
  openaiApiKey: OPENAI_API_KEY,
  dataDir: DATA_DIR,
  dbPath: DB_PATH,
  mcpServerName: 'alexax-mcp-server',
  mcpServerVersion: '1.0.0',
  isTest
};
