import { toolsRegistry, executeToolDirect } from '../../mcp/registry.js';
import { ChatMessage } from '../../db/chatRepo.js';
import { AgentResult } from './mock.js';

export async function runGeminiAgent(
  apiKey: string,
  userText: string,
  history: ChatMessage[]
): Promise<AgentResult> {
  // Format MCP tools for Gemini function declarations
  const functionDeclarations = Object.values(toolsRegistry).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT',
      properties: tool.jsonSchema.properties || {},
      required: tool.jsonSchema.required || []
    }
  }));

  // Build conversation contents
  const contents: any[] = [];

  // Recent history (last 10 turns)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.sender === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.text }]
      });
    } else if (msg.sender === 'assistant') {
      const parts: any[] = [{ text: msg.text }];
      contents.push({
        role: 'model',
        parts
      });
    }
  }

  // Current user turn
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  });

  const toolCalls: Array<{ name: string; args: any }> = [];
  const toolResults: Array<{ name: string; result: any }> = [];

  const modelName = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Step 1: Initial call with tool declarations
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{
          text: `You are AlexaX, an intelligent and helpful AI voice assistant powered by Model Context Protocol (MCP). You have access to real tools for time, calculations, weather, task management, and notes. When answering, use tools when needed and provide clear, conversational, voice-friendly answers.`
        }]
      },
      tools: [{ functionDeclarations }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const candidate = data.candidates?.[0];
  const modelParts = candidate?.content?.parts || [];

  // Check if Gemini invoked any function calls
  const functionCallPart = modelParts.find((p: any) => p.functionCall);

  if (functionCallPart && functionCallPart.functionCall) {
    const call = functionCallPart.functionCall;
    const toolName = call.name;
    const toolArgs = call.args || {};

    toolCalls.push({ name: toolName, args: toolArgs });
    const result = await executeToolDirect(toolName, toolArgs);
    toolResults.push({ name: toolName, result });

    // Step 2: Feed back function response to model to get final spoken answer
    contents.push({
      role: 'model',
      parts: [functionCallPart]
    });

    contents.push({
      role: 'function',
      parts: [{
        functionResponse: {
          name: toolName,
          response: result
        }
      }]
    });

    const followUpRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: [{ functionDeclarations }]
      })
    });

    if (followUpRes.ok) {
      const followUpData: any = await followUpRes.json();
      const followUpCandidate = followUpData.candidates?.[0];
      const finalReply = followUpCandidate?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || 'Task executed successfully.';
      return {
        reply: finalReply,
        toolCalls,
        toolResults
      };
    }
  }

  const finalReply = modelParts.map((p: any) => p.text).filter(Boolean).join('\n') || "I'm here to help!";
  return {
    reply: finalReply,
    toolCalls,
    toolResults
  };
}
