import { format } from 'date-fns';
import {
  CheckSquare, ShoppingBag, Flame, TrendingUp, Clock, Sparkles,
  ArrowRight, Target, Zap
} from 'lucide-react';
import { useAppStore } from '../store/store';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { tasks, orders, habits, setActiveModule, isFocusMode, toggleFocusMode } = useAppStore();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const pendingTasks = tasks.filter(t => !t.completed);
  const todayTasks = tasks.filter(t => t.dueDate === todayStr && !t.completed);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedToday = tasks.filter(t => t.completed).length;
  const todayHabits = habits.filter(h => h.completedDates.includes(todayStr));
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const p1Tasks = pendingTasks.filter(t => t.priority === 'P1');

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
                    <p className="text-xs text-slate-500 mt-0.5">{task.priority} · {task.energyLevel === 'deep' ? 'Deep Work' : 'Shallow'}</p>
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
    <div className="page-padding max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{greeting} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </motion.div>

      {/* Stat Cards — responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Tasks Today', value: todayTasks.length, total: pendingTasks.length + ' total', icon: CheckSquare, color: 'indigo', onClick: () => setActiveModule('tasks') },
          { label: 'Pending Orders', value: pendingOrders.length, total: `₹${pendingOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: ShoppingBag, color: 'amber', onClick: () => setActiveModule('orders') },
          { label: 'Habit Streak', value: totalStreak, total: `${todayHabits.length}/${habits.length} done`, icon: Flame, color: 'rose', onClick: () => setActiveModule('habits') },
          { label: 'Completed', value: completedToday, total: 'tasks done', icon: TrendingUp, color: 'emerald' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={stat.onClick}
              className={`stat-card ${stat.onClick ? 'cursor-pointer hover:bg-white/[0.08] active:scale-[0.98] transition-all' : ''}`}
            >
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-${stat.color}-500/15 flex items-center justify-center mb-2 md:mb-3`}>
                <Icon className={`w-4 h-4 md:w-5 md:h-5 text-${stat.color}-400`} />
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-slate-600 mt-1">{stat.total}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Plan */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base md:text-lg font-semibold text-white">Today's Plan</h2>
            </div>
            <button onClick={() => setActiveModule('tasks')} className="btn-ghost text-xs flex items-center gap-1">
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
              <p className="text-xs text-slate-600 mb-3">No tasks due today — here are your top priorities:</p>
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map(task => <TaskRow key={task._id} task={task} />)}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600">
              <p>No pending tasks. You're all caught up! ✨</p>
            </div>
          )}

          {/* Workload Estimate */}
          <div className="mt-4 md:mt-5 pt-3 md:pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Estimated Workload</span>
              <span>{pendingTasks.length * 30} min ({(pendingTasks.length * 0.5).toFixed(1)}h)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (pendingTasks.length / 10) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">AI Suggestions</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {p1Tasks.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/[0.1]">
                  <p className="text-xs text-rose-400 font-medium">🔥 {p1Tasks.length} critical task{p1Tasks.length > 1 ? 's' : ''} need attention</p>
                  <p className="text-[11px] text-slate-600 mt-1 truncate">Focus on "{p1Tasks[0].title}" first</p>
                </div>
              )}
              {pendingOrders.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.1]">
                  <p className="text-xs text-amber-400 font-medium">📦 {pendingOrders.length} orders awaiting completion</p>
                  <p className="text-[11px] text-slate-600 mt-1">Total: ₹{pendingOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
                </div>
              )}
              <div className="p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.1]">
                <p className="text-xs text-indigo-400 font-medium">💡 Suggested next action</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {pendingTasks.length > 5 ? 'Consider breaking tasks into subtasks for clarity' : 'Great workload balance today!'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Habit Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Habits</h3>
              </div>
              <button onClick={() => setActiveModule('habits')} className="btn-ghost text-xs flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {habits.slice(0, 4).map((habit) => {
                const isDone = habit.completedDates.includes(todayStr);
                return (
                  <HabitRow key={habit._id} habit={habit} isDone={isDone} />
                );
              })}
            </div>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Recent Orders</h3>
              </div>
              <button onClick={() => setActiveModule('orders')} className="btn-ghost text-xs flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {orders.slice(0, 3).map(order => (
                <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.05] transition-colors">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-slate-200 truncate">{order.partyName}</p>
                    <p className="text-xs text-slate-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">₹{order.totalAmount.toLocaleString()}</p>
                    <span className={order.status === 'pending' ? 'status-pending text-[10px]' : 'status-completed text-[10px]'}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────
function TaskRow({ task }: { task: import('../store/store').Task }) {
  const { toggleTaskComplete } = useAppStore();
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
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-semibold priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="tag-chip text-[10px]">{tag}</span>
          ))}
          {task.recurring !== 'none' && (
            <span className="text-[10px] text-slate-600">🔄 {task.recurring}</span>
          )}
        </div>
      </div>
      {task.dueDate && (
        <span className="text-[10px] text-slate-600 shrink-0">{format(new Date(task.dueDate), 'MMM d')}</span>
      )}
    </div>
  );
}

function HabitRow({ habit, isDone }: { habit: import('../store/store').Habit; isDone: boolean }) {
  const { toggleHabitComplete } = useAppStore();
  const todayStr = new Date().toISOString().split('T')[0];
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.04] transition-colors">
      <button
        onClick={() => toggleHabitComplete(habit._id, todayStr)}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all shrink-0 ${
          isDone ? 'bg-emerald-500/20 scale-110' : 'bg-white/[0.06]'
        }`}
        style={{ minWidth: '36px', minHeight: '36px' }}
      >
        {isDone ? '✅' : habit.icon}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? 'text-slate-500' : 'text-slate-200'}`}>{habit.title}</p>
        <p className="text-[10px] text-slate-600">{habit.streak} day streak</p>
      </div>
    </div>
  );
}
