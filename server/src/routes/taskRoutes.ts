import { Router, Request, Response } from 'express';
import { taskRepo } from '../db/taskRepo.js';

export const taskRoutes = Router();

// List tasks with optional ?filter=all|pending|completed or ?query=...
taskRoutes.get('/tasks', (req: Request, res: Response) => {
  try {
    const { filter, query } = req.query;
    if (query && typeof query === 'string') {
      const results = taskRepo.search(query);
      res.json({ success: true, tasks: results });
      return;
    }
    const filterType = (filter === 'pending' || filter === 'completed') ? filter : 'all';
    const list = taskRepo.getAll(filterType);
    res.json({ success: true, tasks: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create task
taskRoutes.post('/tasks', (req: Request, res: Response) => {
  try {
    const { title, description, priority, due_date } = req.body;
    if (!title || title.trim() === '') {
      res.status(400).json({ success: false, error: 'Task title is required.' });
      return;
    }

    const task = taskRepo.create({
      title: title.trim(),
      description,
      priority,
      due_date
    });

    res.status(201).json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle complete
taskRoutes.patch('/tasks/:id/toggle', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = taskRepo.toggleComplete(id);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update task
taskRoutes.put('/tasks/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = taskRepo.update(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete task
taskRoutes.delete('/tasks/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    taskRepo.delete(id);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
