import { create } from 'zustand';
import { api } from '../lib/api';

// ─── Task Types ─────────────────────────────────────────
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type EnergyLevel = 'deep' | 'shallow';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  energyLevel: EnergyLevel;
  dueDate?: string;
  scheduledTime?: string;
  tags: string[];
  subtasks: SubTask[];
  recurring: RecurringType;
  completed: boolean;
  createdAt: string;
}

// ─── Order Types ────────────────────────────────────────
export type OrderStatus = 'pending' | 'completed';
export type PricingType = 'per_kg' | 'per_piece';

export interface OrderItem {
  id: string;
  product: string;
  type: PricingType;
  price: number;
  weight: number;
  quantity: number;
  total: number;
}

export interface Order {
  _id: string;
  partyName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ─── Habit Types ────────────────────────────────────────
export interface Habit {
  _id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDates: string[];
  color: string;
  icon: string;
  createdAt: string;
}

// ─── Note Types ─────────────────────────────────────────
export interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Calendar Types ─────────────────────────────────────
export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

// ─── User / Auth Types ──────────────────────────────────
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  driveConnected: boolean;
  lastBackup?: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    autoBackup: boolean;
  };
}

export interface DriveStatus {
  configured: boolean;
  connected: boolean;
  lastBackup: string | null;
}

// ─── Module Views ───────────────────────────────────────
export type ActiveModule = 'dashboard' | 'tasks' | 'orders' | 'calendar' | 'planner' | 'habits' | 'notes' | 'profile';
export type TaskView = 'list' | 'kanban' | 'timeline';
export type CalendarViewType = 'day' | 'week';

// ─── Store Shape ────────────────────────────────────────
interface AppState {
  // Tasks
  tasks: Task[];
  taskView: TaskView;
  taskFilter: { status?: TaskStatus; priority?: Priority; tag?: string };
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  setTaskView: (view: TaskView) => void;
  setTaskFilter: (filter: { status?: TaskStatus; priority?: Priority; tag?: string }) => void;

  // Orders
  orders: Order[];
  orderFilter: OrderStatus | 'all';
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  setOrderFilter: (filter: OrderStatus | 'all') => void;

  // Habits
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitComplete: (id: string, date: string) => void;

  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Calendar
  timeBlocks: TimeBlock[];
  calendarView: CalendarViewType;
  addTimeBlock: (block: TimeBlock) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  setCalendarView: (view: CalendarViewType) => void;

  // Auth & User
  user: UserProfile | null;
  isAuthenticated: boolean;
  driveStatus: DriveStatus;
  setUser: (user: UserProfile | null) => void;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  setDriveStatus: (status: DriveStatus) => void;

  // UI State
  activeModule: ActiveModule;
  isFocusMode: boolean;
  isAddModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSidebarCollapsed: boolean;
  selectedOrderId: string | null;
  setActiveModule: (module: ActiveModule) => void;
  toggleFocusMode: () => void;
  setAddModalOpen: (val: boolean) => void;
  setCommandPaletteOpen: (val: boolean) => void;
  setSidebarCollapsed: (val: boolean) => void;
  setSelectedOrderId: (id: string | null) => void;
}

// ─── Helper ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];

// ─── Sample Data ────────────────────────────────────────
const sampleTasks: Task[] = [
  {
    _id: uid(), title: 'Finish MVP Backend', description: 'Complete all API endpoints and database models',
    status: 'done', priority: 'P1', energyLevel: 'deep', tags: ['dev', 'backend'],
    subtasks: [
      { id: uid(), title: 'Setup Express routes', completed: true },
      { id: uid(), title: 'Create MongoDB models', completed: true },
    ],
    recurring: 'none', completed: true, createdAt: now(),
  },
  {
    _id: uid(), title: 'Build React UI', description: 'Create dashboard, task views, and order system',
    status: 'in-progress', priority: 'P1', energyLevel: 'deep', tags: ['dev', 'frontend'],
    subtasks: [
      { id: uid(), title: 'Design component library', completed: true },
      { id: uid(), title: 'Build task views', completed: false },
      { id: uid(), title: 'Implement order flow', completed: false },
    ],
    recurring: 'none', completed: false, createdAt: now(), dueDate: today(),
  },
  {
    _id: uid(), title: 'Reply to client emails', status: 'todo', priority: 'P3', energyLevel: 'shallow',
    tags: ['communication'], subtasks: [], recurring: 'daily', completed: false, createdAt: now(),
  },
  {
    _id: uid(), title: 'Review PR #42', status: 'todo', priority: 'P2', energyLevel: 'deep',
    tags: ['dev'], subtasks: [], recurring: 'none', completed: false, createdAt: now(), dueDate: today(),
  },
  {
    _id: uid(), title: 'Update project docs', status: 'todo', priority: 'P4', energyLevel: 'shallow',
    tags: ['docs'], subtasks: [], recurring: 'weekly', completed: false, createdAt: now(),
  },
];

const sampleOrders: Order[] = [
  {
    _id: uid(), partyName: 'Sharma Steels',
    items: [
      { id: uid(), product: 'MS Angle', type: 'per_kg', price: 65, weight: 50, quantity: 1, total: 3250 },
      { id: uid(), product: 'Truss', type: 'per_kg', price: 75, weight: 28, quantity: 2, total: 4200 },
    ],
    status: 'pending', totalAmount: 7450, createdAt: now(), updatedAt: now(),
  },
  {
    _id: uid(), partyName: 'Gupta Hardware',
    items: [
      { id: uid(), product: 'MS Plate 6mm', type: 'per_piece', price: 1200, weight: 0, quantity: 5, total: 6000 },
      { id: uid(), product: 'GI Sheet', type: 'per_kg', price: 82, weight: 120, quantity: 1, total: 9840 },
    ],
    status: 'completed', totalAmount: 15840, createdAt: now(), updatedAt: now(),
  },
  {
    _id: uid(), partyName: 'Rajesh Enterprises',
    items: [
      { id: uid(), product: 'Channel 100mm', type: 'per_kg', price: 70, weight: 45, quantity: 3, total: 9450 },
    ],
    status: 'pending', totalAmount: 9450, createdAt: now(), updatedAt: now(),
  },
];

const sampleHabits: Habit[] = [
  { _id: uid(), title: 'Morning Exercise', frequency: 'daily', streak: 12, completedDates: [today()], color: '#f43f5e', icon: '🏃', createdAt: now() },
  { _id: uid(), title: 'Read 30 mins', frequency: 'daily', streak: 7, completedDates: [], color: '#8b5cf6', icon: '📚', createdAt: now() },
  { _id: uid(), title: 'Meditate', frequency: 'daily', streak: 5, completedDates: [today()], color: '#06b6d4', icon: '🧘', createdAt: now() },
  { _id: uid(), title: 'Weekly Review', frequency: 'weekly', streak: 3, completedDates: [], color: '#f59e0b', icon: '📋', createdAt: now() },
];

const sampleNotes: Note[] = [
  { _id: uid(), title: 'API Design Notes', content: 'Use RESTful conventions. Add rate limiting for public endpoints. Consider GraphQL for mobile.', tags: ['dev', 'api'], createdAt: now(), updatedAt: now() },
  { _id: uid(), title: 'Meeting with Rajesh', content: 'Discussed new order requirements. Need to add bulk pricing feature. Follow up next week.', tags: ['meeting', 'orders'], createdAt: now(), updatedAt: now() },
];

// ─── Store ──────────────────────────────────────────────
export const useAppStore = create<AppState>((set) => ({
  // Tasks
  tasks: [],
  taskView: 'list',
  taskFilter: {},
  setTasks: (tasks) => set({ tasks }),
  addTask: async (task) => {
    set((s) => ({ tasks: [task, ...s.tasks] })); // Optimistic
    try {
      const savedTask = await api.post<Task>('/tasks', task);
      set((s) => ({ tasks: s.tasks.map(t => t._id === task._id ? savedTask : t) }));
    } catch (err) {
      set((s) => ({ tasks: s.tasks.filter(t => t._id !== task._id) })); // Rollback
    }
  },
  updateTask: async (id, updates) => {
    set((s) => ({ tasks: s.tasks.map(t => t._id === id ? { ...t, ...updates } : t) })); // Optimistic
    try {
      await api.put(`/tasks/${id}`, updates);
    } catch (err) { console.error(err); }
  },
  deleteTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter(t => t._id !== id) })); // Optimistic
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) { console.error(err); }
  },
  toggleTaskComplete: async (id) => {
    let targetTask: Task | undefined;
    set((s) => {
      targetTask = s.tasks.find(t => t._id === id);
      return {
        tasks: s.tasks.map(t => t._id === id
          ? { ...t, completed: !t.completed, status: t.completed ? 'todo' : 'done' }
          : t)
      };
    });
    if (targetTask) {
      try {
        await api.put(`/tasks/${id}`, { completed: !targetTask.completed, status: targetTask.completed ? 'todo' : 'done' });
      } catch (err) { console.error(err); }
    }
  },
  toggleSubtask: async (taskId, subtaskId) => {
    let updatedSubtasks: SubTask[] = [];
    set((s) => ({
      tasks: s.tasks.map(t => {
        if (t._id === taskId) {
          updatedSubtasks = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    }));
    try {
      await api.put(`/tasks/${taskId}`, { subtasks: updatedSubtasks });
    } catch (err) { console.error(err); }
  },
  setTaskView: (view) => set({ taskView: view }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),

  // Orders
  orders: sampleOrders,
  orderFilter: 'all',
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
  updateOrder: (id, updates) => set((s) => ({
    orders: s.orders.map(o => o._id === id ? { ...o, ...updates } : o)
  })),
  deleteOrder: (id) => set((s) => ({ orders: s.orders.filter(o => o._id !== id) })),
  setOrderFilter: (filter) => set({ orderFilter: filter }),

  // Habits
  habits: sampleHabits,
  addHabit: (habit) => set((s) => ({ habits: [...s.habits, habit] })),
  updateHabit: (id, updates) => set((s) => ({
    habits: s.habits.map(h => h._id === id ? { ...h, ...updates } : h)
  })),
  deleteHabit: (id) => set((s) => ({ habits: s.habits.filter(h => h._id !== id) })),
  toggleHabitComplete: (id, date) => set((s) => ({
    habits: s.habits.map(h => {
      if (h._id !== id) return h;
      const already = h.completedDates.includes(date);
      return {
        ...h,
        completedDates: already ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date],
        streak: already ? Math.max(0, h.streak - 1) : h.streak + 1,
      };
    })
  })),

  // Notes
  notes: sampleNotes,
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (id, updates) => set((s) => ({
    notes: s.notes.map(n => n._id === id ? { ...n, ...updates } : n)
  })),
  deleteNote: (id) => set((s) => ({ notes: s.notes.filter(n => n._id !== id) })),

  // Calendar
  timeBlocks: [],
  calendarView: 'week',
  addTimeBlock: (block) => set((s) => ({ timeBlocks: [...s.timeBlocks, block] })),
  updateTimeBlock: (id, updates) => set((s) => ({
    timeBlocks: s.timeBlocks.map(b => b.id === id ? { ...b, ...updates } : b)
  })),
  deleteTimeBlock: (id) => set((s) => ({ timeBlocks: s.timeBlocks.filter(b => b.id !== id) })),
  setCalendarView: (view) => set({ calendarView: view }),

  // Auth & User
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  driveStatus: { configured: false, connected: false, lastBackup: null },
  setUser: (user) => set({ user }),
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, activeModule: 'dashboard' });
  },
  setDriveStatus: (status) => set({ driveStatus: status }),

  // UI State
  activeModule: 'dashboard',
  isFocusMode: false,
  isAddModalOpen: false,
  isCommandPaletteOpen: false,
  isSidebarCollapsed: false,
  selectedOrderId: null,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })),
  setAddModalOpen: (val) => set({ isAddModalOpen: val }),
  setCommandPaletteOpen: (val) => set({ isCommandPaletteOpen: val }),
  setSidebarCollapsed: (val) => set({ isSidebarCollapsed: val }),
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
}));
