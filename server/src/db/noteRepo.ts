import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // parsed from JSON text
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: NoteRow): Note {
  let tags: string[] = [];
  if (row.tags) {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export const noteRepo = {
  create(data: { title: string; content: string; tags?: string[] }): Note {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(data.tags || []);

    const stmt = db.prepare(`
      INSERT INTO notes (id, title, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.title, data.content, tagsJson, now, now);

    return {
      id,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      created_at: now,
      updated_at: now
    };
  },

  getAll(): Note[] {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM notes ORDER BY updated_at DESC`);
    const rows = stmt.all() as unknown as NoteRow[];
    return rows.map(rowToNote);
  },

  getById(id: string): Note | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM notes WHERE id = ?`);
    const row = stmt.get(id) as unknown as NoteRow | undefined;
    return row ? rowToNote(row) : null;
  },

  update(id: string, updates: { title?: string; content?: string; tags?: string[] }): Note | null {
    const db = getDb();
    const existing = this.getById(id);
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title : existing.title;
    const content = updates.content !== undefined ? updates.content : existing.content;
    const tags = updates.tags !== undefined ? updates.tags : existing.tags;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(title, content, JSON.stringify(tags), now, id);

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM notes WHERE id = ?`);
    stmt.run(id);
    return true;
  },

  search(query?: string, tag?: string): Note[] {
    const all = this.getAll();
    return all.filter(note => {
      let matchesQuery = true;
      let matchesTag = true;

      if (query && query.trim() !== '') {
        const q = query.toLowerCase();
        matchesQuery = note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
      }

      if (tag && tag.trim() !== '') {
        const t = tag.toLowerCase();
        matchesTag = note.tags.some(item => item.toLowerCase() === t || item.toLowerCase().includes(t));
      }

      return matchesQuery && matchesTag;
    });
  }
};
