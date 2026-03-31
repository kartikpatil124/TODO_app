import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AuthPage from './pages/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import { useAppStore } from './store/store';
import { api } from './lib/api';
function App() {
  const { activeModule, isFocusMode, setCommandPaletteOpen, isAuthenticated, setUser, login, setActiveModule } = useAppStore();

  // Fetch true user profile on mount if authenticated but we don't have full user obj
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/user/me')
        .then((data: any) => setUser(data))
        .catch(console.error); // 401s are auto-logged out by api.ts. Network errors shouldn't disconnect user.
    }
  }, [isAuthenticated, setUser]);

  // Handle Google OAuth Callback Token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Temporarily set a blank user to authenticate immediately.
      // The useEffect above will fetch the true user profile since isAuthenticated becomes true.
      login({} as any, token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

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

  const AppShell = () => (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${
      isFocusMode
        ? 'bg-slate-950'
        : 'bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950'
    } text-white flex`}>
      {!isFocusMode && <Sidebar />}
      <main className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden ${!isFocusMode ? 'pb-20 md:pb-0' : ''}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderModule()}
        </div>
      </main>
      {!isFocusMode && <MobileNav />}
      <AddTaskModal />
      <OrderDetailModal />
      <CommandPalette />
    </div>
  );

  const TasksRouteShell = () => {
    useEffect(() => {
      setActiveModule('tasks');
    }, [setActiveModule]);
    return <AppShell />;
  };

  const DashboardRouteShell = () => {
    useEffect(() => {
      setActiveModule('dashboard');
    }, [setActiveModule]);
    return <AppShell />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected Application Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouteShell />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TasksRouteShell />
          </ProtectedRoute>
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
