import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import CommandPalette from './CommandPalette';
import AddTaskModal from './AddTaskModal';
import ToastContainer from './ToastContainer';
import { useAppStore, Task, UserProfile, Habit, Note, TimeBlock } from '../store/store';
import { api, onServerWakingStateChange } from '../lib/api';

export default function AppLayout() {
  const isFocusMode = useAppStore((s) => s.isFocusMode);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const setTasks = useAppStore((s) => s.setTasks);
  const setHabits = useAppStore((s) => s.setHabits);
  const setNotes = useAppStore((s) => s.setNotes);
  const setTimeBlocks = useAppStore((s) => s.setTimeBlocks);
  const setUser = useAppStore((s) => s.setUser);

  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [isServerWaking, setIsServerWaking] = useState(false);

  // Subscribe to waking server notice from api.ts
  useEffect(() => {
    return onServerWakingStateChange((waking) => setIsServerWaking(waking));
  }, []);

  // Fetch tasks, habits, notes, calendar, and user profile ONCE upon layout mount
  useEffect(() => {
    let isMounted = true;

    api.get<Task[]>('/tasks')
      .then((data) => {
        if (isMounted) {
          setTasks(data);
          setTasksError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setTasksError(err instanceof Error ? err.message : 'Failed to load tasks');
        }
      })
      .finally(() => {
        if (isMounted) {
          setTasksLoading(false);
        }
      });

    api.get<Habit[]>('/habits')
      .then((data) => {
        if (isMounted) setHabits(data);
      })
      .catch(console.error);

    api.get<Note[]>('/notes')
      .then((data) => {
        if (isMounted) setNotes(data);
      })
      .catch(console.error);

    api.get<TimeBlock[]>('/calendar')
      .then((data) => {
        if (isMounted) setTimeBlocks(data);
      })
      .catch(console.error);

    api.get<UserProfile>('/user/me')
      .then((userData) => {
        if (isMounted) setUser(userData);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [setTasks, setHabits, setNotes, setTimeBlocks, setUser]);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${
        isFocusMode
          ? 'bg-slate-950'
          : 'bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950'
      } text-white flex`}
    >
      {!isFocusMode && <Sidebar />}

      <main className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden ${!isFocusMode ? 'pb-20 md:pb-0' : ''}`}>
        {/* Waking Server Banner — non-overlapping in layout flow */}
        {isServerWaking && (
          <div className="w-full bg-amber-500 text-slate-950 text-xs font-semibold py-2 px-4 text-center shadow-md flex items-center justify-center gap-2 shrink-0 animate-pulse">
            <span>⚡ Server is waking up (free tier spins down when inactive). Please wait a moment...</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet context={{ tasksLoading, tasksError }} />
        </div>
      </main>

      {!isFocusMode && <MobileNav />}

      <AddTaskModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
