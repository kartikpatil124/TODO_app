import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckSquare, LayoutDashboard, UserCircle2, Plus,
  Calendar, Target, FileText, ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/store';

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Search;
  action: () => void;
  category: string;
  subtitle?: string;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const isCommandPaletteOpen = useAppStore((s) => s.isCommandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const setAddModalOpen = useAppStore((s) => s.setAddModalOpen);
  const tasks = useAppStore((s) => s.tasks);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setCommandPaletteOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const navigationCommands: CommandItem[] = useMemo(() => [
    { id: 'nav-dash', label: 'Go to Dashboard', icon: LayoutDashboard, category: 'Navigate', action: () => { navigate('/dashboard'); close(); } },
    { id: 'nav-tasks', label: 'Go to Tasks', icon: CheckSquare, category: 'Navigate', action: () => { navigate('/tasks'); close(); } },
    { id: 'nav-cal', label: 'Go to Calendar', icon: Calendar, category: 'Navigate', action: () => { navigate('/calendar'); close(); } },
    { id: 'nav-habits', label: 'Go to Habits', icon: Target, category: 'Navigate', action: () => { navigate('/habits'); close(); } },
    { id: 'nav-notes', label: 'Go to Notes', icon: FileText, category: 'Navigate', action: () => { navigate('/notes'); close(); } },
    { id: 'nav-profile', label: 'Go to Profile', icon: UserCircle2, category: 'Navigate', action: () => { navigate('/profile'); close(); } },
  ], [navigate]);

  const actionCommands: CommandItem[] = useMemo(() => [
    { id: 'act-newtask', label: 'Create New Task', icon: Plus, category: 'Actions', subtitle: 'Add a new task', action: () => { setAddModalOpen(true); close(); } },
  ], [setAddModalOpen]);

  const taskResults: CommandItem[] = useMemo(() => {
    if (!query.trim()) return [];
    return tasks
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((t) => ({
        id: `task-${t._id}`,
        label: t.title,
        icon: CheckSquare,
        category: 'Tasks',
        subtitle: `${t.priority} · ${t.status}`,
        action: () => { navigate('/tasks'); close(); },
      }));
  }, [tasks, query, navigate]);

  const allItems = useMemo(() => {
    if (query.trim()) {
      return [
        ...taskResults,
        ...navigationCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
      ];
    }
    return [...actionCommands, ...navigationCommands];
  }, [query, taskResults, navigationCommands, actionCommands]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, selectedIndex, allItems]);

  const grouped: Record<string, CommandItem[]> = {};
  allItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] md:pt-[15vh] px-3 md:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks or navigate..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
              />
              <kbd className="text-[10px] font-mono text-slate-600 bg-white/[0.06] px-2 py-1 rounded border border-white/[0.08] hidden md:inline">
                ESC
              </kbd>
            </div>
            <div className="max-h-[60vh] md:max-h-80 overflow-y-auto py-2">
              {allItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">No results found</div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <p className="px-4 md:px-5 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      {category}
                    </p>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const currentIndex = flatIndex++;
                      const isSelected = currentIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          className={`w-full flex items-center gap-3 px-4 md:px-5 py-3 text-left transition-colors ${
                            isSelected ? 'bg-indigo-500/10 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          style={{ minHeight: '44px' }}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            {item.subtitle && <p className="text-xs text-slate-600 truncate">{item.subtitle}</p>}
                          </div>
                          {isSelected && <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
