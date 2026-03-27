import {
  LayoutDashboard, CheckSquare, CalendarDays, ShoppingBag,
  Sparkles, StickyNote, Target, ChevronLeft, ChevronRight, Plus, Search, UserCircle2
} from 'lucide-react';
import { useAppStore, ActiveModule } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';

const navItems: { id: ActiveModule; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'habits', icon: Sparkles, label: 'Habits' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
];

export default function Sidebar() {
  const { activeModule, setActiveModule, isSidebarCollapsed, setSidebarCollapsed,
    setAddModalOpen, setCommandPaletteOpen, isFocusMode, toggleFocusMode } = useAppStore();

  if (isFocusMode) return null;

  return (
    <motion.div
      animate={{ width: isSidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex h-screen flex-col border-r border-white/[0.06] bg-slate-950/80 backdrop-blur-xl sticky top-0 overflow-hidden z-30"
    >
      {/* Header */}
      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'px-5'} h-16 border-b border-white/[0.06] shrink-0`}>
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text whitespace-nowrap">Nexus OS</span>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className={`${isSidebarCollapsed ? 'px-3' : 'px-4'} pt-5 pb-2 space-y-2 shrink-0`}>
        <button
          onClick={() => setAddModalOpen(true)}
          className={`w-full btn-primary flex items-center justify-center gap-2 ${isSidebarCollapsed ? 'px-0 py-3' : 'py-3'}`}
        >
          <Plus className="w-5 h-5 shrink-0" />
          {!isSidebarCollapsed && <span>New Task</span>}
        </button>

        {!isSidebarCollapsed && (
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full btn-ghost flex items-center gap-3 text-sm text-slate-500"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isSidebarCollapsed ? 'px-3' : 'px-3'} py-3 space-y-1 overflow-y-auto no-scrollbar`}>
        {!isSidebarCollapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-2">Workspace</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
              {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`${isSidebarCollapsed ? 'px-3' : 'px-4'} pb-4 space-y-3 shrink-0`}>
        {/* Profile/Settings */}
        <button
          onClick={() => setActiveModule('profile')}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
            isSidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
          } ${
            activeModule === 'profile'
              ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent'
          }`}
          title={isSidebarCollapsed ? 'Profile' : undefined}
        >
          <UserCircle2 className={`w-[18px] h-[18px] shrink-0 ${activeModule === 'profile' ? 'text-indigo-400' : ''}`} />
          {!isSidebarCollapsed && <span className="text-sm font-medium">Profile</span>}
        </button>

        {/* Focus Mode */}
        {!isSidebarCollapsed ? (
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/[0.08] to-orange-500/[0.08] border border-rose-500/[0.15]">
            <div className="flex items-center gap-2 mb-1.5 text-rose-400 text-sm font-semibold">
              <Target className="w-4 h-4" /> Focus Mode
            </div>
            <p className="text-xs text-slate-500 mb-2.5">Eliminate all distractions.</p>
            <button
              onClick={toggleFocusMode}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all bg-white/[0.06] hover:bg-white/[0.1] text-slate-300"
            >
              Enter Focus
            </button>
          </div>
        ) : (
          <button
            onClick={toggleFocusMode}
            className="w-full p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15] flex items-center justify-center"
            title="Focus Mode"
          >
            <Target className="w-[18px] h-[18px] text-rose-400" />
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] transition-all"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}
