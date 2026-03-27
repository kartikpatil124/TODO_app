import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Flame, BatteryFull, Calendar, Tag, RotateCcw, ListTodo, Plus } from 'lucide-react';
import { useAppStore, Task, Priority, EnergyLevel, RecurringType, SubTask } from '../store/store';

const uid = () => Math.random().toString(36).substr(2, 9);

export default function AddTaskModal() {
  const { isAddModalOpen, setAddModalOpen, addTask } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P4');
  const [energy, setEnergy] = useState<EnergyLevel>('shallow');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Parse natural language for date/priority hints
  const parsedHints = parseNaturalLanguage(title);

  if (!isAddModalOpen) return null;

  const reset = () => {
    setTitle(''); setDescription(''); setPriority('P4'); setEnergy('shallow');
    setDueDate(''); setTags([]); setTagInput(''); setRecurring('none');
    setSubtasks([]); setSubtaskInput(''); setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      _id: uid(),
      title: title.trim(),
      description: description || undefined,
      status: 'todo',
      priority: parsedHints.priority || priority,
      energyLevel: energy,
      dueDate: parsedHints.date || dueDate || undefined,
      tags,
      subtasks,
      recurring,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);
    setAddModalOpen(false);
    reset();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { id: uid(), title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput('');
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setAddModalOpen(false); reset(); } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] p-5 md:p-6 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setAddModalOpen(false); reset(); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-5 text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> New Task
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Title with NLP */}
            <div>
              <input
                autoFocus
                type="text"
                placeholder="What needs to be done? Try 'Meeting tomorrow @P1'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base text-base"
              />
              {/* NLP Hints */}
              {(parsedHints.date || parsedHints.priority) && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {parsedHints.date && (
                    <span className="badge-indigo text-[10px]">
                      <Calendar className="w-3 h-3" /> {parsedHints.date}
                    </span>
                  )}
                  {parsedHints.priority && (
                    <span className="badge-rose text-[10px]">
                      <Flame className="w-3 h-3" /> {parsedHints.priority}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base text-sm resize-none h-20"
            />

            {/* Priority & Energy Row — responsive */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                  <Flame className="w-3.5 h-3.5" /> Priority
                </label>
                <div className="flex gap-1.5">
                  {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        priority === p
                          ? p === 'P1' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : p === 'P2' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : p === 'P3' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          : 'bg-white/[0.04] text-slate-600 hover:bg-white/[0.08] border border-transparent'
                      }`}
                      style={{ minHeight: '40px' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                  <BatteryFull className="w-3.5 h-3.5" /> Energy
                </label>
                <div className="flex gap-1.5">
                  {(['deep', 'shallow'] as EnergyLevel[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnergy(e)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        energy === e
                          ? e === 'deep' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/[0.04] text-slate-600 hover:bg-white/[0.08] border border-transparent'
                      }`}
                      style={{ minHeight: '40px' }}
                    >
                      {e === 'deep' ? 'Deep' : 'Shallow'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base text-sm"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="tag-chip flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-400 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
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
                <button type="button" onClick={addTag} className="btn-secondary text-sm px-3">Add</button>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              {showAdvanced ? '▲ Hide advanced' : '▼ Show advanced options'}
            </button>

            {showAdvanced && (
              <div className="space-y-4 md:space-y-5 animate-slide-up">
                {/* Recurring */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                    <RotateCcw className="w-3.5 h-3.5" /> Recurring
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', 'daily', 'weekly', 'monthly'] as RecurringType[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRecurring(r)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          recurring === r
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-white/[0.04] text-slate-600 hover:bg-white/[0.08] border border-transparent'
                        }`}
                        style={{ minHeight: '40px' }}
                      >
                        {r === 'none' ? 'Off' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2">
                    <ListTodo className="w-3.5 h-3.5" /> Subtasks
                  </label>
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 mb-1.5 pl-2">
                      <div className="w-4 h-4 rounded border border-slate-600 shrink-0" />
                      <span className="text-sm text-slate-300 flex-1 min-w-0 truncate">{st.title}</span>
                      <button type="button" onClick={() => setSubtasks(subtasks.filter(s => s.id !== st.id))} className="text-slate-600 hover:text-rose-400 p-1 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add subtask"
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                      className="input-base text-sm flex-1"
                    />
                    <button type="button" onClick={addSubtask} className="btn-secondary text-sm px-3">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full btn-primary mt-2"
            >
              Add Task
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Simple NLP Parser ─────────────────────────────────
function parseNaturalLanguage(text: string): { date?: string; priority?: Priority } {
  const result: { date?: string; priority?: Priority } = {};
  const lower = text.toLowerCase();

  // Priority detection
  if (lower.includes('@p1') || lower.includes('urgent') || lower.includes('critical')) result.priority = 'P1';
  else if (lower.includes('@p2') || lower.includes('important')) result.priority = 'P2';
  else if (lower.includes('@p3')) result.priority = 'P3';

  // Date detection
  const today = new Date();
  if (lower.includes('today')) {
    result.date = today.toISOString().split('T')[0];
  } else if (lower.includes('tomorrow')) {
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    result.date = tmr.toISOString().split('T')[0];
  } else if (lower.includes('next week')) {
    const nw = new Date(today);
    nw.setDate(nw.getDate() + 7);
    result.date = nw.toISOString().split('T')[0];
  }

  return result;
}
