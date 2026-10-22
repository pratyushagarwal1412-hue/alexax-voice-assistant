import { config } from '../config.js';
import { chatRepo, ChatMessage } from '../db/chatRepo.js';
import { runMockAgent, AgentResult } from './providers/mock.js';
import { runGeminiAgent } from './providers/gemini.js';
import { runOpenAiAgent } from './providers/openai.js';

export interface ProcessMessageOptions {
  conversationId: string;
  userText: string;
  provider?: 'mock' | 'gemini' | 'openai';
  apiKey?: string;
}

export async function processUserMessage(options: ProcessMessageOptions): Promise<{
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  providerUsed: string;
}> {
  const { conversationId, userText } = options;

  // 1. Record user message in SQLite
  const userMessage = chatRepo.addMessage({
    conversationId,
    sender: 'user',
    text: userText
  });

  // 2. Fetch recent conversation history
  const history = chatRepo.getMessages(conversationId);

  // Exclude the current message from history passed into model
  const pastHistory = history.filter(m => m.id !== userMessage.id);

  // 3. Determine provider
  const preferredProvider = options.provider || config.llmProvider;
  let result: AgentResult;
  let providerUsed = 'mock';

  try {
    if (preferredProvider === 'gemini') {
      const key = options.apiKey || config.geminiApiKey;
      if (key) {
        result = await runGeminiAgent(key, userText, pastHistory);
        providerUsed = 'gemini';
      } else {
        result = await runMockAgent(userText, pastHistory);
        result.reply = `*(Demo Mode: No Gemini API Key configured)*\n\n` + result.reply;
        providerUsed = 'mock';
      }
    } else if (preferredProvider === 'openai') {
      const key = options.apiKey || config.openaiApiKey;
      if (key) {
        result = await runOpenAiAgent(key, userText, pastHistory);
        providerUsed = 'openai';
      } else {
        result = await runMockAgent(userText, pastHistory);
        result.reply = `*(Demo Mode: No OpenAI API Key configured)*\n\n` + result.reply;
        providerUsed = 'mock';
      }
    } else {
      result = await runMockAgent(userText, pastHistory);
      providerUsed = 'mock';
    }
  } catch (error: any) {
    console.warn(`[Agent] Primary provider "${preferredProvider}" failed: ${error.message}. Falling back to internal agent.`);
    result = await runMockAgent(userText, pastHistory);
    result.reply = `*(Notice: Switched to local MCP engine - ${error.message})*\n\n` + result.reply;
    providerUsed = 'mock';
  }

  // 4. Save assistant response to SQLite
  const assistantMessage = chatRepo.addMessage({
    conversationId,
    sender: 'assistant',
    text: result.reply,
    tool_calls: result.toolCalls && result.toolCalls.length > 0 ? result.toolCalls : undefined,
    tool_results: result.toolResults && result.toolResults.length > 0 ? result.toolResults : undefined
  });

  return {
    userMessage,
    assistantMessage,
    providerUsed
  };
}
