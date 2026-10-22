import React, { useState } from 'react';
import { Plus, Search, FileText, X } from 'lucide-react';
import { Note } from '../../types';
import { NoteCard } from './NoteCard';
import { NoteModal } from './NoteModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface NoteViewProps {
  notes: Note[];
  onAddNote: (note: { title: string; content: string; tags: string[] }) => void;
  onDeleteNote: (id: string) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  notes,
  onAddNote,
  onDeleteNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirmation modal state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    noteId: string;
    noteTitle: string;
  }>({
    isOpen: false,
    noteId: '',
    noteTitle: ''
  });

  // Collect all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []))
  );

  const filteredNotes = notes.filter((note) => {
    const matchesQuery =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;

    return matchesQuery && matchesTag;
  });

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteConfirmState({
      isOpen: true,
      noteId: id,
      noteTitle: title
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmState.noteId) {
      onDeleteNote(deleteConfirmState.noteId);
    }
    setDeleteConfirmState({ isOpen: false, noteId: '', noteTitle: '' });
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Notes & Knowledge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Capture thoughts, project ideas, and research. Ask AlexaX: *"Take a note: ..."* to add notes hands-free.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search and Tag filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-space-900/60 p-3 rounded-2xl border border-purple-900/20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by keyword or content..."
            className="w-full pl-9 pr-4 py-2 bg-space-850 border border-purple-900/30 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-purple-600 text-white"
              >
                <span>#{selectedTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-white'
                    : 'bg-space-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-space-900/40 border border-purple-900/20">
            <p className="text-sm text-slate-400">
              No notes found. Create a new note or ask AlexaX to save one for you!
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelectTag={(tag) => setSelectedTag(tag)}
              onDelete={handleDeleteRequest}
            />
          ))
        )}
      </div>

      {/* Create Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddNote}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteConfirmState.noteTitle}"? This cannot be undone.`}
        confirmText="Delete Note"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmState({ isOpen: false, noteId: '', noteTitle: '' })}
      />
    </div>
  );
};
