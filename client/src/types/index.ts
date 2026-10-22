export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  tool_calls?: Array<{
    name: string;
    args: any;
  }>;
  tool_results?: Array<{
    name: string;
    result: any;
  }>;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface Settings {
  provider: 'mock' | 'gemini' | 'openai';
  apiKey: string;
  autoSpeak: boolean;
  voiceIndex: number;
  speechRate: number;
  speechPitch: number;
}
