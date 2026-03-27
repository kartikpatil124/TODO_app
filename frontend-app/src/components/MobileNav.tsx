import { LayoutDashboard, CheckSquare, CalendarDays, ShoppingBag, Sparkles, StickyNote, Plus, UserCircle2 } from 'lucide-react';
import { useAppStore, ActiveModule } from '../store/store';

const tabs: { id: ActiveModule; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { id: 'habits', icon: Sparkles, label: 'Habits' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
];

export default function MobileNav() {
  const { activeModule, setActiveModule, setAddModalOpen } = useAppStore();

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="md:hidden fixed bottom-[88px] right-4 z-40 w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 active:scale-95 transition-transform"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Profile Floating Button */}
      <button
        onClick={() => setActiveModule('profile')}
        className={`md:hidden fixed bottom-[88px] left-4 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
          activeModule === 'profile'
            ? 'bg-indigo-500 shadow-indigo-500/30'
            : 'bg-slate-800/90 border border-white/[0.08] shadow-black/30'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <UserCircle2 className={`w-5 h-5 ${activeModule === 'profile' ? 'text-white' : 'text-slate-400'}`} />
      </button>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.06]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-1 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveModule(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 rounded-xl transition-all ${
                  isActive ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400'
                }`}
                style={{ minHeight: '44px' }}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' : ''}`} />
                <span className="text-[9px] font-semibold tracking-wide truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

