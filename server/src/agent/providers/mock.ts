import { executeToolDirect } from '../../mcp/registry.js';
import { ChatMessage } from '../../db/chatRepo.js';

export interface AgentResult {
  reply: string;
  toolCalls?: Array<{
    name: string;
    args: any;
  }>;
  toolResults?: Array<{
    name: string;
    result: any;
  }>;
}

/**
 * Intelligent intent-driven fallback agent that operates with full MCP tool execution
 * even when no third-party LLM API keys are provided.
 */
export async function runMockAgent(
  userText: string,
  history: ChatMessage[]
): Promise<AgentResult> {
  const text = userText.trim();
  const lower = text.toLowerCase();

  const toolCalls: Array<{ name: string; args: any }> = [];
  const toolResults: Array<{ name: string; result: any }> = [];

  // Helper to execute and record
  async function invoke(name: string, args: any) {
    toolCalls.push({ name, args });
    const result = await executeToolDirect(name, args);
    toolResults.push({ name, result });
    return result;
  }

  // 1. Time Intent
  // e.g. "what time is it in Tokyo?", "current time", "what's the time in London?"
  const timeMatch = lower.match(/(?:what(?:\s*is)?\s*(?:the\s*)?time|current\s*time|what\s*day|what\s*date)(?:\s*(?:is\s*it\s*)?in\s+([a-zA-Z\s/_]+))?/i);
  if (timeMatch || lower.includes('time in ') || lower.includes('what time') || lower === 'time') {
    let timezone: string | undefined = undefined;
    const locMatch = lower.match(/in\s+([a-zA-Z\s]+)/i);
    if (locMatch) {
      const loc = locMatch[1].trim().toLowerCase();
      const tzMap: Record<string, string> = {
        'tokyo': 'Asia/Tokyo',
        'japan': 'Asia/Tokyo',
        'london': 'Europe/London',
        'uk': 'Europe/London',
        'england': 'Europe/London',
        'new york': 'America/New_York',
        'ny': 'America/New_York',
        'los angeles': 'America/Los_Angeles',
        'la': 'America/Los_Angeles',
        'california': 'America/Los_Angeles',
        'san francisco': 'America/Los_Angeles',
        'chicago': 'America/Chicago',
        'delhi': 'Asia/Kolkata',
        'mumbai': 'Asia/Kolkata',
        'india': 'Asia/Kolkata',
        'kolkata': 'Asia/Kolkata',
        'bangalore': 'Asia/Kolkata',
        'bengaluru': 'Asia/Kolkata',
        'paris': 'Europe/Paris',
        'france': 'Europe/Paris',
        'berlin': 'Europe/Berlin',
        'germany': 'Europe/Berlin',
        'sydney': 'Australia/Sydney',
        'australia': 'Australia/Sydney',
        'toronto': 'America/Toronto',
        'dubai': 'Asia/Dubai',
        'singapore': 'Asia/Singapore',
        'utc': 'UTC',
        'gmt': 'UTC'
      };
      timezone = tzMap[loc];
    }

    const res = await invoke('get_current_time', { timezone });
    const reply = timezone 
      ? `The current time in ${locMatch ? locMatch[1].trim() : res.timezone} is **${res.formattedTime}**.`
      : `The current time is **${res.formattedTime}** (${res.timezone}).`;

    return { reply, toolCalls, toolResults };
  }

  // 2. Weather Intent
  // e.g. "what's the weather in Seattle?", "weather Tokyo", "is it raining in London?"
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast') || lower.includes('is it raining') || lower.includes('climate')) {
    let city = 'San Francisco';
    const cityMatch = text.match(/\b(?:in|for|at)\s+([a-zA-Z\s]+)/i);
    if (cityMatch && cityMatch[1].trim()) {
      city = cityMatch[1].trim().replace(/[?!.]+$/, '');
    } else {
      const words = lower.replace(/weather|temperature|what|is|the|like|today|current/gi, '').trim();
      if (words) city = words;
    }

    const units = lower.includes('fahrenheit') || lower.includes('in f') ? 'fahrenheit' : 'celsius';
    const res = await invoke('get_weather', { city, units });
    
    return {
      reply: res.formattedSummary,
      toolCalls,
      toolResults
    };
  }

  // 3. Math / Calculation Intent
  // e.g. "calculate 15% tip on 85", "what is 25 * 4", "solve 100 / 4"
  const isExplicitMath = lower.startsWith('calculate') || lower.startsWith('compute') || lower.startsWith('solve');
  const mathExprMatch = text.match(/(?:calculate|compute|solve|what(?:\s*is|'s)?)\s+([\d\s+\-*/%().^a-zA-Z]+)/i)
    || text.match(/([\d.]+\s*[%+\-*/^]\s*[\d.]+)/);

  if ((isExplicitMath || (mathExprMatch && /\d/.test(mathExprMatch[1] || mathExprMatch[0]))) && !lower.includes('task') && !lower.includes('note')) {
    let expr = '';
    if (isExplicitMath) {
      expr = text.replace(/^(?:calculate|compute|solve)\s+/i, '').trim();
    } else if (mathExprMatch && (mathExprMatch[1] || mathExprMatch[0])) {
      expr = (mathExprMatch[1] || mathExprMatch[0]).trim();
    }

    if (expr && /\d/.test(expr)) {
      const res = await invoke('calculate', { expression: expr });
      if (res.success) {
        return {
          reply: `The result of \`${res.expression}\` is **${res.formattedResult}**.`,
          toolCalls,
          toolResults
        };
      } else {
        return {
          reply: `I attempted to calculate that expression, but encountered an error: ${res.error}`,
          toolCalls,
          toolResults
        };
      }
    }
  }

  // 4. Task Management Intent
  // Create task: "add a task to ...", "create task: ...", "remind me to ...", "new task ..."
  if (lower.startsWith('add task') || lower.startsWith('create task') || lower.startsWith('new task') || lower.includes('add a task') || lower.includes('remind me to')) {
    let title = text
      .replace(/^(?:please\s+)?(?:add\s+a\s+task\s+to|create\s+a\s+task\s+to|add\s+task(?:\s+to)?|create\s+task(?:\s*:)?|new\s+task(?:\s*:)?|remind\s+me\s+to)\s+/i, '')
      .trim();

    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lower.includes('high priority') || lower.includes('urgent') || lower.includes('priority high')) {
      priority = 'high';
      title = title.replace(/\s*(?:with\s+)?(?:high\s+priority|urgent|priority\s+high)/gi, '');
    } else if (lower.includes('low priority') || lower.includes('priority low')) {
      priority = 'low';
      title = title.replace(/\s*(?:with\s+)?(?:low\s+priority|priority\s+low)/gi, '');
    }

    if (!title) title = 'General Task';

    const res = await invoke('manage_tasks', {
      action: 'create',
      title,
      priority
    });

    return {
      reply: `I've created the task **"${res.task.title}"** with **${res.task.priority}** priority.`,
      toolCalls,
      toolResults
    };
  }

  // Complete task: "complete task ...", "mark task ... as done", "finish task ..."
  if (lower.includes('complete task') || lower.includes('mark task') || lower.includes('finish task') || lower.includes('done with task')) {
    const taskName = text.replace(/^(?:please\s+)?(?:complete\s+task|mark\s+task|finish\s+task|done\s+with\s+task)\s+/i, '').replace(/\s+(?:as\s+done|completed)$/i, '').trim();
    const res = await invoke('manage_tasks', {
      action: 'complete',
      title: taskName
    });

    if (res.success) {
      return {
        reply: `Task **"${res.task.title}"** has been marked as **${res.task.status}**! 🎉`,
        toolCalls,
        toolResults
      };
    } else {
      return {
        reply: `I couldn't find a task matching "${taskName}". Please check your tasks in the Tasks tab or ask me to list your tasks.`,
        toolCalls,
        toolResults
      };
    }
  }

  // Delete task: "delete task ...", "remove task ..."
  if (lower.startsWith('delete task') || lower.startsWith('remove task')) {
    const taskName = text.replace(/^(?:please\s+)?(?:delete\s+task|remove\s+task)\s+/i, '').trim();
    const res = await invoke('manage_tasks', {
      action: 'delete',
      title: taskName
    });

    if (res.success) {
      return {
        reply: `Task **"${res.deletedTaskTitle}"** has been permanently removed.`,
        toolCalls,
        toolResults
      };
    } else {
      return {
        reply: `I couldn't find a task matching "${taskName}".`,
        toolCalls,
        toolResults
      };
    }
  }

  // List tasks: "list tasks", "show tasks", "what are my tasks", "pending tasks"
  if (lower.includes('my tasks') || lower.includes('list tasks') || lower.includes('show tasks') || lower.includes('pending tasks') || lower === 'tasks') {
    const filter = lower.includes('pending') ? 'pending' : (lower.includes('completed') ? 'completed' : 'all');
    const res = await invoke('manage_tasks', { action: 'list', filter });

    if (res.tasks.length === 0) {
      return {
        reply: `You currently have no ${filter === 'all' ? '' : filter + ' '}tasks recorded. You can ask me to add one anytime!`,
        toolCalls,
        toolResults
      };
    }

    const taskLines = res.tasks.map((t: any, i: number) => 
      `${i + 1}. [${t.status === 'completed' ? 'x' : ' '}] **${t.title}** (${t.priority} priority)${t.due_date ? ` - Due: ${t.due_date}` : ''}`
    ).join('\n');

    return {
      reply: `Here are your ${filter === 'all' ? '' : filter + ' '}tasks (${res.count} total):\n\n${taskLines}`,
      toolCalls,
      toolResults
    };
  }

  // 5. Note Management Intent
  // Create note: "take a note: ...", "create note ...", "save note: ..."
  if (lower.startsWith('take a note') || lower.startsWith('create note') || lower.startsWith('save note') || lower.startsWith('new note')) {
    const contentPart = text.replace(/^(?:please\s+)?(?:take\s+a\s+note(?:\s*:)?|create\s+(?:a\s+)?note(?:\s*:)?|save\s+(?:a\s+)?note(?:\s*:)?|new\s+note(?:\s*:)?)\s+/i, '').trim();
    
    let title = 'Quick Note';
    let content = contentPart;
    if (contentPart.includes(':')) {
      const splits = contentPart.split(':');
      title = splits[0].trim();
      content = splits.slice(1).join(':').trim();
    } else if (contentPart.length > 30) {
      title = contentPart.substring(0, 30) + '...';
    } else {
      title = contentPart || 'Untitled Note';
    }

    const res = await invoke('create_note', {
      title,
      content: content || title,
      tags: ['alexax', 'voice-note']
    });

    return {
      reply: `I have saved your note **"${res.note.title}"** into your persistent notes. You can view or search it anytime!`,
      toolCalls,
      toolResults
    };
  }

  // Search notes: "search notes for ...", "find notes about ..."
  if (lower.includes('search notes') || lower.includes('find notes') || lower.includes('show notes') || lower === 'notes') {
    const queryMatch = text.match(/(?:for|about|containing)\s+([a-zA-Z0-9\s]+)/i);
    const query = queryMatch ? queryMatch[1].trim() : '';

    const res = await invoke('search_notes', { query });
    if (res.notes.length === 0) {
      return {
        reply: query 
          ? `No notes found matching "${query}".`
          : `You don't have any notes stored yet. Ask me to "Take a note: ..." to create one!`,
        toolCalls,
        toolResults
      };
    }

    const noteLines = res.notes.map((n: any, i: number) => 
      `${i + 1}. **${n.title}**\n   ${n.content.substring(0, 100)}${n.content.length > 100 ? '...' : ''}\n   *Tags: ${n.tags.join(', ') || 'none'}*`
    ).join('\n\n');

    return {
      reply: `Found ${res.count} note(s):\n\n${noteLines}`,
      toolCalls,
      toolResults
    };
  }

  // 6. Conversational / Capability / Context Responses
  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('your name')) {
    return {
      reply: `I am **AlexaX — Your Personal AI Agent**, inspired by the Alexa+ challenge. I can chat, speak via text-to-speech, listen via voice recognition, and execute real tasks using the Model Context Protocol (MCP)!\n\nI can check the weather, solve math, manage your tasks, save notes, and tell you the time across different timezones.`
    };
  }

  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('capabilities')) {
    return {
      reply: `Here is what I can do with my Model Context Protocol (MCP) server:\n\n` +
        `🌤️ **Live Weather:** *"What's the weather in Tokyo?"*\n` +
        `🧮 **Calculations:** *"Calculate 15% tip on $85.50"*\n` +
        `📋 **Task Management:** *"Add a task to submit the challenge"*, *"Show my pending tasks"*, *"Complete task 1"*\n` +
        `📝 **Notes:** *"Take a note: Architecture ideas"*, *"Search notes for ideas"*\n` +
        `⏰ **Global Time:** *"What time is it in London?"*\n` +
        `🎙️ **Voice:** Click the microphone button to speak with me hands-free!`
    };
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon')) {
    return {
      reply: `Hello! Great to hear from you. How can I assist you right now? You can ask for weather, math, tasks, notes, or time, or talk to me using voice!`
    };
  }

  if (lower.includes('thank') || lower.includes('awesome') || lower.includes('great job')) {
    return {
      reply: `You're very welcome! Let me know if there's anything else I can do for you.`
    };
  }

  // Default intelligent contextual response
  return {
    reply: `I understand: "${text}". I have access to tools for weather forecasts, math calculations, task tracking, notes, and global time via Model Context Protocol (MCP). How would you like me to assist with this?`
  };
}
