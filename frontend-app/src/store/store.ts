import { create } from 'zustand';
import { api } from '../lib/api';
import { uid } from '../lib/id';

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
  createdAt?: string;
}

// ─── Note Types ─────────────────────────────────────────
export interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Calendar Types ─────────────────────────────────────
export interface TimeBlock {
  _id?: string;
  id?: string;
  taskId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  createdAt?: string;
}

// ─── User / Auth Types ──────────────────────────────────
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
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

// ─── Toast Types ────────────────────────────────────────
export interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info';
}

// ─── Module Views ───────────────────────────────────────
export type TaskView = 'list' | 'kanban' | 'timeline';
export type CalendarViewType = 'day' | 'week';

// ─── Store Shape ────────────────────────────────────────
interface AppState {
  // Tasks
  tasks: Task[];
  taskView: TaskView;
  setTasks: (tasks: Task[]) => void;
  addTask: (taskInput: Omit<Task, '_id' | 'createdAt'> & { _id?: string; createdAt?: string }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  setTaskView: (view: TaskView) => void;

  // Toasts
  toasts: Toast[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

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
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Omit<Habit, '_id'> & { _id?: string }) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitComplete: (id: string, date: string) => Promise<void>;

  // Notes
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Omit<Note, '_id'> & { _id?: string }) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Calendar
  timeBlocks: TimeBlock[];
  calendarView: CalendarViewType;
  setTimeBlocks: (blocks: TimeBlock[]) => void;
  addTimeBlock: (block: Omit<TimeBlock, '_id' | 'id'> & { _id?: string; id?: string }) => Promise<void>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;
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
  isFocusMode: boolean;
  isAddModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isSidebarCollapsed: boolean;
  selectedOrderId: string | null;
  toggleFocusMode: () => void;
  setAddModalOpen: (val: boolean) => void;
  setCommandPaletteOpen: (val: boolean) => void;
  setSidebarCollapsed: (val: boolean) => void;
  setSelectedOrderId: (id: string | null) => void;
}

// ─── Store ──────────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  // Toasts
  toasts: [],
  addToast: (msg, type = 'info') => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // Tasks
  tasks: [],
  taskView: 'list',
  setTasks: (tasks) => set({ tasks }),
  addTask: async (taskInput) => {
    const tempId = `temp-${uid()}`;
    const optimisticTask: Task = {
      _id: tempId,
      title: taskInput.title,
      description: taskInput.description,
      status: taskInput.status,
      priority: taskInput.priority,
      energyLevel: taskInput.energyLevel,
      dueDate: taskInput.dueDate,
      tags: taskInput.tags,
      subtasks: taskInput.subtasks,
      recurring: taskInput.recurring,
      completed: taskInput.completed,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ tasks: [optimisticTask, ...s.tasks] })); // Optimistic

    try {
      // Send task to server WITHOUT temporary client _id
      const payload = {
        title: taskInput.title,
        description: taskInput.description,
        status: taskInput.status,
        priority: taskInput.priority,
        energyLevel: taskInput.energyLevel,
        dueDate: taskInput.dueDate,
        tags: taskInput.tags,
        subtasks: taskInput.subtasks,
        recurring: taskInput.recurring,
        completed: taskInput.completed,
      };
      const savedTask = await api.post<Task>('/tasks', payload);
      set((s) => ({
        tasks: s.tasks.map((t) => (t._id === tempId ? savedTask : t))
      }));
    } catch (err) {
      // Rollback
      set((s) => ({ tasks: s.tasks.filter((t) => t._id !== tempId) }));
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      get().addToast(msg, 'error');
    }
  },
  updateTask: async (id, updates) => {
    const previousTasks = get().tasks;
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === id ? { ...t, ...updates } : t))
    })); // Optimistic
    try {
      await api.put(`/tasks/${id}`, updates);
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      get().addToast(msg, 'error');
    }
  },
  deleteTask: async (id) => {
    const previousTasks = get().tasks;
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) })); // Optimistic
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      get().addToast(msg, 'error');
    }
  },
  toggleTaskComplete: async (id) => {
    const previousTasks = get().tasks;
    const target = previousTasks.find((t) => t._id === id);
    if (!target) return;
    const newCompleted = !target.completed;
    const newStatus: TaskStatus = newCompleted ? 'done' : 'todo';
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t._id === id ? { ...t, completed: newCompleted, status: newStatus } : t
      )
    }));
    try {
      await api.put(`/tasks/${id}`, { completed: newCompleted, status: newStatus });
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to toggle task status';
      get().addToast(msg, 'error');
    }
  },
  toggleSubtask: async (taskId, subtaskId) => {
    const previousTasks = get().tasks;
    const target = previousTasks.find((t) => t._id === taskId);
    if (!target) return;
    const updatedSubtasks = target.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t._id === taskId ? { ...t, subtasks: updatedSubtasks } : t
      )
    }));
    try {
      await api.put(`/tasks/${taskId}`, { subtasks: updatedSubtasks });
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      const msg = err instanceof Error ? err.message : 'Failed to update subtask';
      get().addToast(msg, 'error');
    }
  },
  setTaskView: (view) => set({ taskView: view }),

  // Orders
  orders: [],
  orderFilter: 'all',
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
  updateOrder: (id, updates) => set((s) => ({
    orders: s.orders.map(o => o._id === id ? { ...o, ...updates } : o)
  })),
  deleteOrder: (id) => set((s) => ({ orders: s.orders.filter(o => o._id !== id) })),
  setOrderFilter: (filter) => set({ orderFilter: filter }),

  // Habits
  habits: [],
  setHabits: (habits) => set({ habits }),
  addHabit: async (habitInput) => {
    const tempId = `temp-${uid()}`;
    const optimistic: Habit = {
      _id: tempId,
      title: habitInput.title,
      frequency: habitInput.frequency || 'daily',
      streak: 0,
      completedDates: [],
      color: habitInput.color || 'indigo',
      icon: habitInput.icon || '🎯',
    };
    set((s) => ({ habits: [optimistic, ...s.habits] }));
    try {
      const saved = await api.post<Habit>('/habits', {
        title: habitInput.title,
        frequency: habitInput.frequency,
        color: habitInput.color,
        icon: habitInput.icon,
      });
      set((s) => ({
        habits: s.habits.map((h) => (h._id === tempId ? saved : h))
      }));
    } catch (err) {
      set((s) => ({ habits: s.habits.filter((h) => h._id !== tempId) }));
      const msg = err instanceof Error ? err.message : 'Failed to create habit';
      get().addToast(msg, 'error');
    }
  },
  updateHabit: async (id, updates) => {
    const previous = get().habits;
    set((s) => ({
      habits: s.habits.map((h) => (h._id === id ? { ...h, ...updates } : h))
    }));
    try {
      await api.put(`/habits/${id}`, updates);
    } catch (err) {
      set({ habits: previous });
      const msg = err instanceof Error ? err.message : 'Failed to update habit';
      get().addToast(msg, 'error');
    }
  },
  deleteHabit: async (id) => {
    const previous = get().habits;
    set((s) => ({ habits: s.habits.filter((h) => h._id !== id) }));
    try {
      await api.delete(`/habits/${id}`);
    } catch (err) {
      set({ habits: previous });
      const msg = err instanceof Error ? err.message : 'Failed to delete habit';
      get().addToast(msg, 'error');
    }
  },
  toggleHabitComplete: async (id, date) => {
    const previous = get().habits;
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h._id !== id) return h;
        const already = h.completedDates.includes(date);
        return {
          ...h,
          completedDates: already ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date],
        };
      })
    }));
    try {
      const updated = await api.post<Habit>(`/habits/${id}/toggle`, { date });
      set((s) => ({
        habits: s.habits.map((h) => (h._id === id ? updated : h))
      }));
    } catch (err) {
      set({ habits: previous });
      const msg = err instanceof Error ? err.message : 'Failed to toggle habit';
      get().addToast(msg, 'error');
    }
  },

  // Notes
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: async (noteInput) => {
    const tempId = `temp-${uid()}`;
    const optimistic: Note = {
      _id: tempId,
      title: noteInput.title,
      content: noteInput.content || '',
      tags: noteInput.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ notes: [optimistic, ...s.notes] }));
    try {
      const saved = await api.post<Note>('/notes', {
        title: noteInput.title,
        content: noteInput.content,
        tags: noteInput.tags,
      });
      set((s) => ({
        notes: s.notes.map((n) => (n._id === tempId ? saved : n))
      }));
    } catch (err) {
      set((s) => ({ notes: s.notes.filter((n) => n._id !== tempId) }));
      const msg = err instanceof Error ? err.message : 'Failed to create note';
      get().addToast(msg, 'error');
    }
  },
  updateNote: async (id, updates) => {
    const previous = get().notes;
    set((s) => ({
      notes: s.notes.map((n) => (n._id === id ? { ...n, ...updates } : n))
    }));
    try {
      await api.put(`/notes/${id}`, updates);
    } catch (err) {
      set({ notes: previous });
      const msg = err instanceof Error ? err.message : 'Failed to update note';
      get().addToast(msg, 'error');
    }
  },
  deleteNote: async (id) => {
    const previous = get().notes;
    set((s) => ({ notes: s.notes.filter((n) => n._id !== id) }));
    try {
      await api.delete(`/notes/${id}`);
    } catch (err) {
      set({ notes: previous });
      const msg = err instanceof Error ? err.message : 'Failed to delete note';
      get().addToast(msg, 'error');
    }
  },

  // Calendar
  timeBlocks: [],
  calendarView: 'week',
  setTimeBlocks: (timeBlocks) => set({ timeBlocks }),
  addTimeBlock: async (blockInput) => {
    const tempId = `temp-${uid()}`;
    const optimistic: TimeBlock = {
      _id: tempId,
      id: tempId,
      title: blockInput.title,
      date: blockInput.date,
      startTime: blockInput.startTime,
      endTime: blockInput.endTime,
      color: blockInput.color || 'indigo',
      taskId: blockInput.taskId,
    };
    set((s) => ({ timeBlocks: [...s.timeBlocks, optimistic] }));
    try {
      const saved = await api.post<TimeBlock>('/calendar', {
        title: blockInput.title,
        date: blockInput.date,
        startTime: blockInput.startTime,
        endTime: blockInput.endTime,
        color: blockInput.color,
        taskId: blockInput.taskId,
      });
      set((s) => ({
        timeBlocks: s.timeBlocks.map((b) => ((b._id === tempId || b.id === tempId) ? { ...saved, id: saved._id } : b))
      }));
    } catch (err) {
      set((s) => ({ timeBlocks: s.timeBlocks.filter((b) => b._id !== tempId && b.id !== tempId) }));
      const msg = err instanceof Error ? err.message : 'Failed to create time block';
      get().addToast(msg, 'error');
    }
  },
  updateTimeBlock: async (id, updates) => {
    const previous = get().timeBlocks;
    set((s) => ({
      timeBlocks: s.timeBlocks.map((b) => ((b._id === id || b.id === id) ? { ...b, ...updates } : b))
    }));
    try {
      await api.put(`/calendar/${id}`, updates);
    } catch (err) {
      set({ timeBlocks: previous });
      const msg = err instanceof Error ? err.message : 'Failed to update time block';
      get().addToast(msg, 'error');
    }
  },
  deleteTimeBlock: async (id) => {
    const previous = get().timeBlocks;
    set((s) => ({ timeBlocks: s.timeBlocks.filter((b) => b._id !== id && b.id !== id) }));
    try {
      await api.delete(`/calendar/${id}`);
    } catch (err) {
      set({ timeBlocks: previous });
      const msg = err instanceof Error ? err.message : 'Failed to delete time block';
      get().addToast(msg, 'error');
    }
  },
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
    set({ user: null, isAuthenticated: false });
  },
  setDriveStatus: (status) => set({ driveStatus: status }),

  // UI State
  isFocusMode: false,
  isAddModalOpen: false,
  isCommandPaletteOpen: false,
  isSidebarCollapsed: false,
  selectedOrderId: null,
  toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })),
  setAddModalOpen: (val) => set({ isAddModalOpen: val }),
  setCommandPaletteOpen: (val) => set({ isCommandPaletteOpen: val }),
  setSidebarCollapsed: (val) => set({ isSidebarCollapsed: val }),
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth-unauthorized', () => {
    useAppStore.getState().logout();
  });
}

