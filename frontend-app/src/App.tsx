import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import CommandPalette from './components/CommandPalette';
import AddTaskModal from './components/AddTaskModal';
import OrderDetailModal from './components/OrderDetailModal';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import OrdersPage from './pages/OrdersPage';
import CalendarPage from './pages/CalendarPage';
import HabitsPage from './pages/HabitsPage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import { useAppStore } from './store/store';

function App() {
  const { activeModule, isFocusMode, setCommandPaletteOpen } = useAppStore();

  // Global keyboard shortcut for Command Palette
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

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TasksPage />;
      case 'orders': return <OrdersPage />;
      case 'calendar': return <CalendarPage />;
      case 'habits': return <HabitsPage />;
      case 'notes': return <NotesPage />;
      case 'profile': return <ProfilePage />;
      default: return <Dashboard />;
    }
  };

  return (
    <BrowserRouter>
      <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${
        isFocusMode
          ? 'bg-slate-950'
          : 'bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950'
      } text-white flex`}>
        {/* Desktop Sidebar */}
        {!isFocusMode && <Sidebar />}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden ${!isFocusMode ? 'pb-20 md:pb-0' : ''}`}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {renderModule()}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        {!isFocusMode && <MobileNav />}

        {/* Modals & Overlays */}
        <AddTaskModal />
        <OrderDetailModal />
        <CommandPalette />
      </div>
    </BrowserRouter>
  );
}

export default App;
