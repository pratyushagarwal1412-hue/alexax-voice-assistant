import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index.js';

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

export const taskRepo = {
  create(data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }): Task {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const priority = data.priority || 'medium';
    const description = data.description || null;
    const dueDate = data.due_date || null;

    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, completed_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL)
    `);
    stmt.run(id, data.title, description, priority, dueDate, now);

    return {
      id,
      title: data.title,
      description,
      status: 'pending',
      priority,
      due_date: dueDate,
      created_at: now,
      completed_at: null,
    };
  },

  getAll(filter?: 'all' | 'pending' | 'completed'): Task[] {
    const db = getDb();
    if (filter === 'pending') {
      const stmt = db.prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at DESC`);
      return stmt.all() as unknown as Task[];
    } else if (filter === 'completed') {
      const stmt = db.prepare(`SELECT * FROM tasks WHERE status = 'completed' ORDER BY completed_at DESC`);
      return stmt.all() as unknown as Task[];
    }
    const stmt = db.prepare(`SELECT * FROM tasks ORDER BY created_at DESC`);
    return stmt.all() as unknown as Task[];
  },

  getById(id: string): Task | null {
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
    const result = stmt.get(id);
    return (result as unknown as Task) || null;
  },

  toggleComplete(id: string): Task | null {
    const db = getDb();
    const task = this.getById(id);
    if (!task) return null;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(newStatus, completedAt, id);

    return this.getById(id);
  },

  update(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Task | null {
    const db = getDb();
    const task = this.getById(id);
    if (!task) return null;

    const title = updates.title !== undefined ? updates.title : task.title;
    const description = updates.description !== undefined ? updates.description : task.description;
    const status = updates.status !== undefined ? updates.status : task.status;
    const priority = updates.priority !== undefined ? updates.priority : task.priority;
    const dueDate = updates.due_date !== undefined ? updates.due_date : task.due_date;
    const completedAt = status === 'completed' && !task.completed_at ? new Date().toISOString() : (status === 'pending' ? null : task.completed_at);

    const stmt = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(title, description, status, priority, dueDate, completedAt, id);

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM tasks WHERE id = ?`);
    stmt.run(id);
    return true;
  },

  search(query: string): Task[] {
    const db = getDb();
    const pattern = `%${query.toLowerCase()}%`;
    const stmt = db.prepare(`
      SELECT * FROM tasks 
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ?
      ORDER BY created_at DESC
    `);
    return stmt.all(pattern, pattern) as unknown as Task[];
  }
};
