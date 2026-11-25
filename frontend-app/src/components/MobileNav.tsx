import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Plus, UserCircle2, Calendar, Target, FileText } from 'lucide-react';
import { useAppStore } from '../store/store';

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/habits', icon: Target, label: 'Habits' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/profile', icon: UserCircle2, label: 'Profile' },
];

export default function MobileNav() {
  const setAddModalOpen = useAppStore((s) => s.setAddModalOpen);

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

      {/* Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.06]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 rounded-xl transition-all ${
                    isActive ? 'text-indigo-400' : 'text-slate-600 active:text-slate-400'
                  }`
                }
                style={{ minHeight: '44px' }}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]' : ''}`} />
                    <span className="text-[10px] font-semibold tracking-wide truncate">{tab.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
