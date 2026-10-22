import { ChatMessage, Conversation, Task, Note, McpTool } from '../types';

const BASE_URL = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Chat & Conversations
  async getConversations(): Promise<Conversation[]> {
    const data = await fetchJson<{ success: boolean; conversations: Conversation[] }>('/api/conversations');
    return data.conversations;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const data = await fetchJson<{ success: boolean; conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return data.conversation;
  },

  async getConversation(id: string): Promise<Conversation> {
    const data = await fetchJson<{ success: boolean; conversation: Conversation }>(`/api/conversations/${id}`);
    return data.conversation;
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchJson(`/api/conversations/${id}`, { method: 'DELETE' });
  },

  async sendChatMessage(payload: {
    conversationId: string;
    message: string;
    provider?: string;
    apiKey?: string;
  }): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    providerUsed: string;
    conversationId: string;
  }> {
    return await fetchJson('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Tasks
  async getTasks(filter?: 'all' | 'pending' | 'completed', query?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (query) params.append('query', query);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchJson<{ success: boolean; tasks: Task[] }>(`/api/tasks${queryString}`);
    return data.tasks;
  },

  async createTask(task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }): Promise<Task> {
    const data = await fetchJson<{ success: boolean; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
    return data.task;
  },

  async toggleTaskComplete(id: string): Promise<Task> {
    const data = await fetchJson<{ success: boolean; task: Task }>(`/api/tasks/${id}/toggle`, {
      method: 'PATCH'
    });
    return data.task;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const data = await fetchJson<{ success: boolean; task: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await fetchJson(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // Notes
  async getNotes(query?: string, tag?: string): Promise<Note[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (tag) params.append('tag', tag);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchJson<{ success: boolean; notes: Note[] }>(`/api/notes${queryString}`);
    return data.notes;
  },

  async createNote(note: { title: string; content: string; tags?: string[] }): Promise<Note> {
    const data = await fetchJson<{ success: boolean; note: Note }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
    return data.note;
  },

  async updateNote(id: string, updates: { title?: string; content?: string; tags?: string[] }): Promise<Note> {
    const data = await fetchJson<{ success: boolean; note: Note }>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.note;
  },

  async deleteNote(id: string): Promise<void> {
    await fetchJson(`/api/notes/${id}`, { method: 'DELETE' });
  },

  // MCP Tools
  async getMcpTools(): Promise<McpTool[]> {
    const data = await fetchJson<{ success: boolean; tools: McpTool[] }>('/api/mcp/tools');
    return data.tools;
  },

  async executeMcpTool(name: string, parameters: any): Promise<{
    success: boolean;
    tool: string;
    parameters: any;
    result: any;
    durationMs: number;
    error?: string;
  }> {
    return await fetchJson('/api/mcp/execute', {
      method: 'POST',
      body: JSON.stringify({ name, parameters })
    });
  },

  async getMcpStatus(): Promise<any> {
    return await fetchJson('/api/mcp/status');
  },

  async getSettings(): Promise<any> {
    return await fetchJson('/api/settings');
  }
};
