import { toolsRegistry, executeToolDirect } from '../../mcp/registry.js';
import { ChatMessage } from '../../db/chatRepo.js';
import { AgentResult } from './mock.js';

export async function runOpenAiAgent(
  apiKey: string,
  userText: string,
  history: ChatMessage[]
): Promise<AgentResult> {
  const tools = Object.values(toolsRegistry).map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.jsonSchema
    }
  }));

  const messages: any[] = [
    {
      role: 'system',
      content: 'You are AlexaX, an intelligent and helpful AI voice assistant powered by Model Context Protocol (MCP). You have access to real tools for time, calculations, weather, task management, and notes. When answering, use tools when needed and provide clear, conversational, voice-friendly answers.'
    }
  ];

  // Recent history
  for (const msg of history.slice(-10)) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  }

  messages.push({
    role: 'user',
    content: userText
  });

  const toolCalls: Array<{ name: string; args: any }> = [];
  const toolResults: Array<{ name: string; result: any }> = [];

  const url = 'https://api.openai.com/v1/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto'
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data: any = await res.json();
  const choice = data.choices?.[0];
  const responseMessage = choice?.message;

  if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const tc of responseMessage.tool_calls) {
      const toolName = tc.function.name;
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {
        args = {};
      }

      toolCalls.push({ name: toolName, args });
      const result = await executeToolDirect(toolName, args);
      toolResults.push({ name: toolName, result });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result)
      });
    }

    // Step 2: Second completion to summarize tool results
    const followUpRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages
      })
    });

    if (followUpRes.ok) {
      const followUpData: any = await followUpRes.json();
      const finalReply = followUpData.choices?.[0]?.message?.content || 'Task executed successfully.';
      return {
        reply: finalReply,
        toolCalls,
        toolResults
      };
    }
  }

  return {
    reply: responseMessage?.content || "I'm here to help!",
    toolCalls,
    toolResults
  };
}
