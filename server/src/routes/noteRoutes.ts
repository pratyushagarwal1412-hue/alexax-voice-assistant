import { Router, Request, Response } from 'express';
import { noteRepo } from '../db/noteRepo.js';

export const noteRoutes = Router();

// List or search notes
noteRoutes.get('/notes', (req: Request, res: Response) => {
  try {
    const { query, tag } = req.query;
    if (query || tag) {
      const results = noteRepo.search(query as string | undefined, tag as string | undefined);
      res.json({ success: true, notes: results });
      return;
    }
    const list = noteRepo.getAll();
    res.json({ success: true, notes: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create note
noteRoutes.post('/notes', (req: Request, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Both title and content are required for a note.' });
      return;
    }

    const note = noteRepo.create({
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : []
    });

    res.status(201).json({ success: true, note });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get note by ID
noteRoutes.get('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const note = noteRepo.getById(id);
    if (!note) {
      res.status(404).json({ success: false, error: 'Note not found' });
      return;
    }
    res.json({ success: true, note });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update note
noteRoutes.put('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = noteRepo.update(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Note not found' });
      return;
    }
    res.json({ success: true, note: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete note
noteRoutes.delete('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    noteRepo.delete(id);
    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
