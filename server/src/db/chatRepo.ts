import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  tool_calls?: any[];
  tool_results?: any[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender: string;
  text: string;
  tool_calls: string | null;
  tool_results: string | null;
  timestamp: string;
}

function rowToMessage(row: MessageRow): ChatMessage {
  let tool_calls: any[] | undefined;
  let tool_results: any[] | undefined;

  if (row.tool_calls) {
    try {
      tool_calls = JSON.parse(row.tool_calls);
    } catch {
      tool_calls = undefined;
    }
  }

  if (row.tool_results) {
    try {
      tool_results = JSON.parse(row.tool_results);
    } catch {
      tool_results = undefined;
    }
  }

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender: row.sender as 'user' | 'assistant' | 'system',
    text: row.text,
    tool_calls,
    tool_results,
    timestamp: row.timestamp
  };
}

export const chatRepo = {
  createConversation(title?: string): Conversation {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const convTitle = title || 'New Conversation';

    const stmt = db.prepare(`
      INSERT INTO conversations (id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, convTitle, now, now);

    return {
      id,
      title: convTitle,
      created_at: now,
      updated_at: now,
      messages: []
    };
  },

  getConversations(): Conversation[] {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM conversations ORDER BY updated_at DESC`);
    return stmt.all() as unknown as Conversation[];
  },

  getConversationById(id: string): Conversation | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM conversations WHERE id = ?`);
    const conv = stmt.get(id) as unknown as Conversation | undefined;
    if (!conv) return null;

    conv.messages = this.getMessages(id);
    return conv;
  },

  deleteConversation(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM conversations WHERE id = ?`);
    stmt.run(id);
    return true;
  },

  addMessage(data: {
    conversationId: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    tool_calls?: any[];
    tool_results?: any[];
  }): ChatMessage {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const toolCallsJson = data.tool_calls ? JSON.stringify(data.tool_calls) : null;
    const toolResultsJson = data.tool_results ? JSON.stringify(data.tool_results) : null;

    // Ensure conversation exists
    let conv = this.getConversationById(data.conversationId);
    if (!conv) {
      // Auto-create conversation if missing
      const title = data.text.length > 30 ? data.text.substring(0, 30) + '...' : data.text;
      const stmtConv = db.prepare(`
        INSERT INTO conversations (id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      stmtConv.run(data.conversationId, title, now, now);
    } else {
      // Update timestamp and optionally title if default
      const stmtUpdate = db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`);
      stmtUpdate.run(now, data.conversationId);
    }

    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, text, tool_calls, tool_results, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.conversationId, data.sender, data.text, toolCallsJson, toolResultsJson, now);

    return {
      id,
      conversation_id: data.conversationId,
      sender: data.sender,
      text: data.text,
      tool_calls: data.tool_calls,
      tool_results: data.tool_results,
      timestamp: now
    };
  },

  getMessages(conversationId: string): ChatMessage[] {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(conversationId) as unknown as MessageRow[];
    return rows.map(rowToMessage);
  },

  clearMessages(conversationId: string): boolean {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM messages WHERE conversation_id = ?`);
    stmt.run(conversationId);
    return true;
  }
};
