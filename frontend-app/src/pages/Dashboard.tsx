import { format } from 'date-fns';
import {
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Plus,
  Compass,
  Flame,
  StickyNote,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, Task } from '../store/store';
import { getTodayString } from '../lib/date';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const notes = useAppStore((s) => s.notes);
  const isFocusMode = useAppStore((s) => s.isFocusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const setAddModalOpen = useAppStore((s) => s.setAddModalOpen);
  const toggleHabitComplete = useAppStore((s) => s.toggleHabitComplete);
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = getTodayString();
  const greeting =
    today.getHours() < 12
      ? 'Good Morning'
      : today.getHours() < 17
      ? 'Good Afternoon'
      : 'Good Evening';

  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayTasks = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const taskDateStr = t.dueDate.includes('T')
      ? format(new Date(t.dueDate), 'yyyy-MM-dd')
      : t.dueDate;
    return taskDateStr === todayStr;
  });
  const p1Tasks = pendingTasks.filter((t) => t.priority === 'P1');
  const completedHabitsToday = habits.filter((h) =>
    h.completedDates.includes(todayStr)
  ).length;

  // Focus Mode View
  if (isFocusMode) {
    const focusTasks = p1Tasks.slice(0, 3);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
        <div className="text-center w-full max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold gradient-text mb-3"
          >
            Focus Horizon
          </motion.h1>
          <p className="text-slate-500 mb-10">Only your most critical tasks. Nothing else.</p>

          <div className="space-y-4">
            {focusTasks.map((task, i) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-interactive text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{task.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {task.priority} · {task.energyLevel === 'deep' ? 'Deep Work' : 'Shallow'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {focusTasks.length === 0 && (
              <p className="text-slate-600 py-8">No P1 tasks. You're in the clear! ✨</p>
            )}
          </div>

          <button onClick={toggleFocusMode} className="btn-secondary mt-8">
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-padding max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
            {greeting} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
          <button
            onClick={toggleFocusMode}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400" /> Focus
          </button>
        </div>
      </motion.div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: 'Tasks Today',
            value: todayTasks.length,
            total: `${pendingTasks.length} pending total`,
            icon: CheckSquare,
            color: 'indigo',
            onClick: () => navigate('/tasks'),
          },
          {
            label: 'Habits Done',
            value: `${completedHabitsToday}/${habits.length}`,
            total: habits.length > 0 ? `${Math.round((completedHabitsToday / habits.length) * 100)}% completed` : 'no habits set',
            icon: Flame,
            color: 'emerald',
            onClick: () => navigate('/habits'),
          },
          {
            label: 'Notes',
            value: notes.length,
            total: 'ideas & memos',
            icon: StickyNote,
            color: 'amber',
            onClick: () => navigate('/notes'),
          },
          {
            label: 'Critical (P1)',
            value: p1Tasks.length,
            total: 'urgent priority',
            icon: Zap,
            color: 'rose',
            onClick: () => navigate('/tasks'),
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={stat.onClick}
              className="stat-card cursor-pointer hover:bg-white/[0.08] active:scale-[0.98] transition-all"
            >
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-${stat.color}-500/15 flex items-center justify-center mb-2 md:mb-3`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 text-${stat.color}-400`} />
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-slate-600 mt-1">{stat.total}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Today's Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base md:text-lg font-semibold text-white">Today's Plan</h2>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </div>
            ) : pendingTasks.length > 0 ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">
                  No tasks due today — here are your top priorities:
                </p>
                <div className="space-y-2">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <TaskRow key={task._id} task={task} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-600">
                <p>No pending tasks. You're all caught up! ✨</p>
              </div>
            )}

            {/* Workload Estimate */}
            <div className="mt-4 md:mt-5 pt-3 md:pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Estimated Workload
                </span>
                <span>
                  {pendingTasks.length * 30} min ({(pendingTasks.length * 0.5).toFixed(1)}h)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (pendingTasks.length / 10) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Today's Habits Check-In */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-base md:text-lg font-semibold text-white">Habit Tracker</h2>
              </div>
              <button
                onClick={() => navigate('/habits')}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {habits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {habits.slice(0, 6).map((habit) => {
                  const isDone = habit.completedDates.includes(todayStr);
                  return (
                    <div
                      key={habit._id}
                      onClick={() => toggleHabitComplete(habit._id, todayStr)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{habit.icon || '🎯'}</span>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isDone ? 'text-emerald-300' : 'text-slate-200'
                            }`}
                          >
                            {habit.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-medium">
                              <Flame className="w-2.5 h-2.5" /> {habit.streak} streak
                            </span>
                            <span className="text-[10px] text-slate-500 capitalize">
                              · {habit.frequency}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-600">
                <p className="text-sm">No habits established yet.</p>
                <button
                  onClick={() => navigate('/habits')}
                  className="btn-secondary text-xs mt-2"
                >
                  Create Your First Habit
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* Smart Insights */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Smart Insights</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {p1Tasks.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/[0.1]">
                  <p className="text-xs text-rose-400 font-medium">
                    🔥 {p1Tasks.length} critical task{p1Tasks.length > 1 ? 's' : ''} need attention
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    Focus on "{p1Tasks[0].title}" first
                  </p>
                </div>
              )}
              <div className="p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.1]">
                <p className="text-xs text-indigo-400 font-medium">💡 Productivity Tip</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {pendingTasks.length > 5
                    ? 'Break down tasks into quick 25-minute sprints.'
                    : pendingTasks.length > 0
                    ? 'Solid progress. Finish your active tasks to hit peak momentum!'
                    : 'All tasks completed! Great time to plan ahead.'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Notes */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Recent Notes</h3>
              </div>
              <button
                onClick={() => navigate('/notes')}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                All Notes <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.slice(0, 3).map((note) => (
                  <div
                    key={note._id}
                    onClick={() => navigate('/notes')}
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition cursor-pointer"
                  >
                    <p className="text-xs font-medium text-white truncate">{note.title}</p>
                    {note.content && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{note.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-600 text-xs">
                No notes captured yet.
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Compass className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="w-full btn-primary text-xs flex items-center justify-center gap-2 py-2.5"
              >
                <Plus className="w-4 h-4" /> Create New Task
              </button>
              <button
                onClick={() => navigate('/calendar')}
                className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2.5"
              >
                <Clock className="w-4 h-4 text-indigo-400" /> Open Calendar
              </button>
              <button
                onClick={() => navigate('/notes')}
                className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2.5"
              >
                <StickyNote className="w-4 h-4 text-amber-400" /> Add a Note
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────
function TaskRow({ task }: { task: Task }) {
  const toggleTaskComplete = useAppStore((s) => s.toggleTaskComplete);
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.06] transition-all">
      <button
        onClick={() => toggleTaskComplete(task._id)}
        className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600 hover:border-indigo-400'
        }`}
        style={{ minWidth: '24px', minHeight: '24px' }}
      >
        {task.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            task.completed ? 'line-through text-slate-600' : 'text-slate-200'
          }`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-semibold priority-${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-chip text-[10px]">
              {tag}
            </span>
          ))}
          {task.recurring !== 'none' && (
            <span className="text-[10px] text-slate-500">🔄 {task.recurring}</span>
          )}
        </div>
      </div>
      {task.dueDate && (
        <span className="text-[10px] text-slate-500 shrink-0">
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </div>
  );
}
