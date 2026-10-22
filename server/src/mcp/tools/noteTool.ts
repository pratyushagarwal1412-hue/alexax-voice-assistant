import { z } from 'zod';
import { noteRepo } from '../../db/noteRepo.js';

export const createNoteSchema = z.object({
  title: z.string().min(1).describe('Title of the note'),
  content: z.string().min(1).describe('Detailed content/body of the note'),
  tags: z.array(z.string()).optional().describe('Optional list of tag labels for categorizing the note')
});

export const searchNotesSchema = z.object({
  query: z.string().optional().describe('Keyword or phrase to search within note titles and contents'),
  tag: z.string().optional().describe('Specific tag to filter notes by')
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type SearchNotesInput = z.infer<typeof searchNotesSchema>;

export async function executeCreateNote(input: CreateNoteInput) {
  try {
    const note = noteRepo.create({
      title: input.title,
      content: input.content,
      tags: input.tags || []
    });

    return {
      success: true,
      message: `Note "${note.title}" created successfully.`,
      note
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to create note: ${error.message}`
    };
  }
}

export async function executeSearchNotes(input: SearchNotesInput) {
  try {
    const notes = noteRepo.search(input.query, input.tag);
    return {
      success: true,
      count: notes.length,
      query: input.query || null,
      tag: input.tag || null,
      notes
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to search notes: ${error.message}`,
      notes: []
    };
  }
}
