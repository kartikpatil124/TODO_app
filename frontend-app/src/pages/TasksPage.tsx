import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Flame, BatteryFull, BatteryLow, ChevronDown, ChevronRight,
  List, LayoutGrid, Trash2, Tag, RotateCcw, Calendar, Plus, Search
} from 'lucide-react';
import { useAppStore, Task, TaskStatus, Priority } from '../store/store';

export default function TasksPage() {
  const { tasks, taskView, setTaskView, toggleTaskComplete, toggleSubtask, deleteTask,
    setAddModalOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const filtered = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTasks);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedTasks(next);
  };

  return (
    <div className="page-padding max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAddModalOpen(true)} className="btn-primary text-sm flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> New Task
          </button>
          <div className="flex bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
            <button onClick={() => setTaskView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskView === 'list' ? 'bg-white/[0.1] text-white' : 'text-slate-500'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setTaskView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${taskView === 'kanban' ? 'bg-white/[0.1] text-white' : 'text-slate-500'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters — responsive: stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-5 md:mb-6">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
            className="input-base w-auto py-2.5 text-sm pr-8 flex-1 sm:flex-none"
          >
            <option value="all">All Priorities</option>
            <option value="P1">🔥 P1</option>
            <option value="P2">⚡ P2</option>
            <option value="P3">📌 P3</option>
            <option value="P4">📋 P4</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="input-base w-auto py-2.5 text-sm pr-8 flex-1 sm:flex-none"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {taskView === 'list' && (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`card group transition-all ${task.completed ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Expand toggle */}
                  {task.subtasks.length > 0 && (
                    <button onClick={() => toggleExpand(task._id)} className="mt-0.5 text-slate-600 hover:text-slate-400" style={{ minWidth: '20px', minHeight: '20px' }}>
                      {expandedTasks.has(task._id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskComplete(task._id)}
                    className="mt-0.5 shrink-0"
                    style={{ minWidth: '24px', minHeight: '24px' }}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2">
                      <span className={`badge text-[10px] ${
                        task.priority === 'P1' ? 'badge-rose' : task.priority === 'P2' ? 'badge-amber' : task.priority === 'P3' ? 'badge-indigo' : 'badge-slate'
                      }`}>
                        {task.priority === 'P1' && <Flame className="w-3 h-3" />}
                        {task.priority}
                      </span>
                      <span className={`badge text-[10px] ${task.energyLevel === 'deep' ? 'badge-amber' : 'badge-emerald'}`}>
                        {task.energyLevel === 'deep' ? <BatteryFull className="w-3 h-3" /> : <BatteryLow className="w-3 h-3" />}
                        {task.energyLevel === 'deep' ? 'Deep' : 'Shallow'}
                      </span>
                      {task.dueDate && (
                        <span className="badge badge-slate text-[10px]">
                          <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                      {task.recurring !== 'none' && (
                        <span className="badge badge-indigo text-[10px]">
                          <RotateCcw className="w-3 h-3" /> {task.recurring}
                        </span>
                      )}
                      {task.tags.map(tag => (
                        <span key={tag} className="tag-chip text-[10px] hidden xs:inline-flex">
                          <Tag className="w-2.5 h-2.5" /> {tag}
                        </span>
                      ))}
                      {task.subtasks.length > 0 && (
                        <span className="text-[10px] text-slate-600">
                          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions — always visible on touch */}
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="touch-action-btn text-slate-700 hover:text-rose-400 transition-colors shrink-0 p-1"
                    style={{ minWidth: '28px', minHeight: '28px' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Subtasks */}
                {expandedTasks.has(task._id) && task.subtasks.length > 0 && (
                  <div className="mt-3 ml-6 md:ml-10 space-y-1.5 pt-3 border-t border-white/[0.04]">
                    {task.subtasks.map(st => (
                      <button
                        key={st.id}
                        onClick={() => toggleSubtask(task._id, st.id)}
                        className="flex items-center gap-2 w-full text-left hover:bg-white/[0.02] active:bg-white/[0.04] rounded-lg px-2 py-2 transition-colors"
                        style={{ minHeight: '36px' }}
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                        )}
                        <span className={`text-sm ${st.completed ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                          {st.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <p className="text-lg mb-2">No tasks found</p>
              <p className="text-sm">Create a new task or adjust your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {taskView === 'kanban' && <KanbanBoard tasks={filtered} />}
    </div>
  );
}

// ─── Kanban Board — horizontal scroll on mobile ─────────
function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const { updateTask, toggleTaskComplete } = useAppStore();

  const columns: { id: TaskStatus; label: string; borderColor: string }[] = [
    { id: 'todo', label: 'To Do', borderColor: 'border-t-slate-500' },
    { id: 'in-progress', label: 'In Progress', borderColor: 'border-t-indigo-500' },
    { id: 'done', label: 'Done', borderColor: 'border-t-emerald-500' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTask(taskId, { status, completed: status === 'done' });
    }
  };

  return (
    <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-5 min-h-[60vh] overflow-x-auto snap-x-container md:overflow-x-visible pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`glass rounded-2xl border-t-2 ${col.borderColor} flex flex-col snap-x-item w-[85vw] min-w-[280px] md:w-auto md:min-w-0`}
            onDrop={(e) => { e.preventDefault(); handleDrop(e, col.id); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-200">{col.label}</h3>
              <span className="text-xs bg-white/[0.08] px-2 py-0.5 rounded-full text-slate-400">{colTasks.length}</span>
            </div>

            <div className="p-3 flex-1 space-y-3 overflow-y-auto">
              {colTasks.map(task => (
                <motion.div
                  layout
                  key={task._id}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, task._id)}
                  className="bg-slate-900/60 border border-white/[0.06] p-3.5 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-500/30 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {task.title}
                    </span>
                    <button onClick={() => toggleTaskComplete(task._id)} className="shrink-0 ml-2 p-1" style={{ minWidth: '28px', minHeight: '28px' }}>
                      {task.completed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <Circle className="w-4 h-4 text-slate-600 hover:text-indigo-400" />}
                    </button>
                  </div>

                  {task.subtasks.length > 0 && (
                    <div className="mb-2">
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      task.priority === 'P1' ? 'bg-rose-500/15 text-rose-400'
                      : task.priority === 'P2' ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-white/[0.06] text-slate-500'
                    }`}>{task.priority}</span>
                    {task.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag-chip text-[10px]">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
