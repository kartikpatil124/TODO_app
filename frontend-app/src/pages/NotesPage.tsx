import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, StickyNote, Search, Tag } from 'lucide-react';
import { useAppStore, Note } from '../store/store';
import { format } from 'date-fns';

const uid = () => Math.random().toString(36).substr(2, 9);

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = notes.filter(n => {
    if (!searchQuery) return true;
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const openNew = () => {
    setTitle(''); setContent(''); setTags([]); setTagInput('');
    setEditingId(null);
    setShowAdd(true);
  };

  const openEdit = (note: Note) => {
    setTitle(note.title); setContent(note.content); setTags(note.tags); setTagInput('');
    setEditingId(note._id);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateNote(editingId, { title: title.trim(), content, tags, updatedAt: now });
    } else {
      const note: Note = {
        _id: uid(),
        title: title.trim(),
        content,
        tags,
        createdAt: now,
        updatedAt: now,
      };
      addNote(note);
    }
    setShowAdd(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const CARD_COLORS = [
    'from-indigo-500/10 to-purple-500/10 border-indigo-500/15',
    'from-amber-500/10 to-orange-500/10 border-amber-500/15',
    'from-emerald-500/10 to-teal-500/10 border-emerald-500/15',
    'from-rose-500/10 to-pink-500/10 border-rose-500/15',
    'from-cyan-500/10 to-blue-500/10 border-cyan-500/15',
  ];

  return (
    <div className="page-padding max-w-6xl mx-auto">
      {/* Header — responsive stacking */}
      <div className="flex flex-col gap-3 mb-5 md:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <StickyNote className="w-5 h-5 md:w-6 md:h-6 text-amber-400" /> Notes
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{notes.length} notes</p>
          </div>
          {/* Desktop new note button */}
          <button onClick={openNew} className="btn-primary text-sm items-center gap-2 hidden sm:flex">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10 py-2.5 text-sm"
            />
          </div>
          {/* Mobile new note button */}
          <button onClick={openNew} className="btn-primary text-sm flex items-center gap-2 sm:hidden shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence>
          {filtered.map((note, i) => {
            const colorClass = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openEdit(note)}
                className={`group rounded-2xl border p-4 md:p-5 bg-gradient-to-br ${colorClass} cursor-pointer hover:-translate-y-1 active:scale-[0.98] hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <h3 className="font-semibold text-white text-base line-clamp-1 flex-1 min-w-0 mr-2">{note.title}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                    className="touch-action-btn p-1 rounded-lg hover:bg-rose-500/20 active:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition shrink-0"
                    style={{ minWidth: '28px', minHeight: '28px' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm text-slate-400 line-clamp-3 mb-3 whitespace-pre-wrap">{note.content}</p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-wrap gap-1 flex-1 min-w-0 mr-2">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-chip text-[10px]">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{format(new Date(note.updatedAt), 'MMM d')}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">No notes yet</p>
          <p className="text-sm">Capture ideas, thoughts, and meeting notes</p>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] p-5 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition p-1" style={{ minWidth: '32px', minHeight: '32px' }}>
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-4">
                {editingId ? 'Edit Note' : 'New Note'}
              </h3>

              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Note title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base text-base font-medium"
                />

                <textarea
                  placeholder="Write your note..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-base text-sm resize-none h-32 md:h-40"
                />

                {/* Tags */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map(tag => (
                      <span key={tag} className="tag-chip flex items-center gap-1">
                        {tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-400 p-0.5"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="input-base text-sm flex-1"
                    />
                    <button onClick={addTag} className="btn-secondary text-sm px-3">Add</button>
                  </div>
                </div>

                <button onClick={handleSave} disabled={!title.trim()} className="w-full btn-primary text-sm">
                  {editingId ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
