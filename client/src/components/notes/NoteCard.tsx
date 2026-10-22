import React from 'react';
import { Tag, Trash2, Calendar } from 'lucide-react';
import { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onSelectTag: (tag: string) => void;
  onDelete: (id: string, title: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onSelectTag,
  onDelete
}) => {
  return (
    <div className="p-5 rounded-2xl bg-space-850/80 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-lg shadow-purple-950/20 group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-base font-bold text-white tracking-wide group-hover:text-purple-300 transition-colors">
            {note.title}
          </h4>
          <button
            type="button"
            onClick={() => onDelete(note.id, note.title)}
            title="Delete note"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6 mb-4">
          {note.content}
        </p>
      </div>

      <div>
        {/* Tag pills */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.tags.map((tag, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectTag(tag)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-purple-900/20">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-400" />
            {new Date(note.updated_at).toLocaleDateString()}
          </span>
          <span className="text-[10px] uppercase font-mono text-slate-400">
            {note.content.length} chars
          </span>
        </div>
      </div>
    </div>
  );
};
