import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Trash2, X, Check } from 'lucide-react';
import { useAppStore, Habit } from '../store/store';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];

const ICONS = ['🏃', '📚', '🧘', '💧', '✍️', '🎯', '💪', '🎵', '🧠', '🌿', '💤', '📋'];
const COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

export default function HabitsPage() {
  const { habits, addHabit, deleteHabit, toggleHabitComplete } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#6366f1');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  const todayStr = today();

  const handleAdd = () => {
    if (!title.trim()) return;
    const habit: Habit = {
      _id: uid(),
      title: title.trim(),
      frequency,
      streak: 0,
      completedDates: [],
      color,
      icon,
      createdAt: new Date().toISOString(),
    };
    addHabit(habit);
    setTitle(''); setIcon('🎯'); setColor('#6366f1'); setFrequency('daily');
    setShowAdd(false);
  };

  // Generate last 7 days for heatmap
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="page-padding max-w-5xl mx-auto">
      {/* Header — responsive stacking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Habits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Build consistency, track your streaks</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-2 justify-center w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Daily Check-off */}
      <div className="card mb-6 md:mb-8">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">Today's Habits</h2>
        <div className="space-y-3">
          {habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && new Date().getDay() === 1)).map(habit => {
            const isDone = habit.completedDates.includes(todayStr);
            return (
              <motion.div
                key={habit._id}
                layout
                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] active:bg-white/[0.04]'
                }`}
              >
                <button
                  onClick={() => toggleHabitComplete(habit._id, todayStr)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all shrink-0 ${
                    isDone ? 'bg-emerald-500/20 scale-110' : 'bg-white/[0.06]'
                  }`}
                  style={{ borderColor: habit.color + '40', borderWidth: isDone ? 0 : 2, minWidth: '40px', minHeight: '40px' }}
                >
                  {isDone ? <Check className="w-5 h-5 text-emerald-400" /> : habit.icon}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>{habit.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Flame className="w-3 h-3 text-orange-400" /> {habit.streak} day streak
                    </span>
                    <span className="text-xs text-slate-600">· {habit.frequency}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteHabit(habit._id)}
                  className="shrink-0 p-2 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/10 transition"
                  style={{ minWidth: '36px', minHeight: '36px' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
          {habits.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              <p>No habits yet. Start building better routines!</p>
            </div>
          )}
        </div>
      </div>

      {/* Streak Heatmap */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">7-Day Streak Overview</h2>
        <div className="overflow-x-auto no-scrollbar -mx-1">
          <div className="min-w-[400px] px-1">
            {/* Day headers */}
            <div className="grid gap-1.5 md:gap-2 mb-2" style={{ gridTemplateColumns: `120px repeat(7, 1fr)` }}>
              <div />
              {last7Days.map(d => (
                <div key={d} className="text-center text-[9px] md:text-[10px] font-medium text-slate-600">
                  {new Date(d).toLocaleDateString('en', { weekday: 'short' })}
                </div>
              ))}
            </div>

            {/* Habit rows */}
            {habits.map(habit => (
              <div key={habit._id} className="grid gap-1.5 md:gap-2 mb-2 items-center" style={{ gridTemplateColumns: `120px repeat(7, 1fr)` }}>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm shrink-0">{habit.icon}</span>
                  <span className="text-[11px] md:text-xs text-slate-400 truncate">{habit.title}</span>
                </div>
                {last7Days.map(d => {
                  const done = habit.completedDates.includes(d);
                  return (
                    <div key={d} className="flex justify-center">
                      <div
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs transition-all ${
                          done
                            ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/[0.03] text-slate-700 border border-white/[0.04]'
                        }`}
                      >
                        {done ? '✓' : '·'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/[0.1] p-5 rounded-t-2xl md:rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition p-1" style={{ minWidth: '32px', minHeight: '32px' }}>
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold text-white mb-4">New Habit</h3>
              <div className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Habit title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />

                {/* Icon Picker */}
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(ic => (
                      <button
                        key={ic}
                        onClick={() => setIcon(ic)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition ${
                          icon === ic ? 'bg-indigo-500/20 border border-indigo-500/30 scale-110' : 'bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.08]'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Frequency</label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFrequency(f)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                          frequency === f ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-white/[0.04] text-slate-500 border border-transparent'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleAdd} disabled={!title.trim()} className="w-full btn-primary text-sm">
                  Create Habit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
