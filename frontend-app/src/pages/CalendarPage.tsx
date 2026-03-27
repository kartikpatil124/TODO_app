import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import { useAppStore, TimeBlock } from '../store/store';
import { motion } from 'framer-motion';

const uid = () => Math.random().toString(36).substr(2, 9);
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

export default function CalendarPage() {
  const { tasks, timeBlocks, calendarView, setCalendarView, addTimeBlock, deleteTimeBlock } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState('10:00');
  const [newBlockDate, setNewBlockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and force day view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && calendarView === 'week') {
        setCalendarView('day');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [calendarView, setCalendarView]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goNext = () => setCurrentDate(d => addDays(d, calendarView === 'week' ? 7 : 1));
  const goPrev = () => setCurrentDate(d => addDays(d, calendarView === 'week' ? -7 : -1));
  const goToday = () => setCurrentDate(new Date());

  const displayDays = calendarView === 'week' ? weekDays : [currentDate];

  const getBlocksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeBlocks.filter(b => b.date === dateStr);
  };

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(t => t.dueDate === dateStr && !t.completed);
  };

  const handleAddBlock = () => {
    if (!newBlockTitle.trim()) return;
    const block: TimeBlock = {
      id: uid(),
      title: newBlockTitle.trim(),
      date: newBlockDate,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      color: 'indigo',
    };
    addTimeBlock(block);
    setNewBlockTitle('');
    setShowAddBlock(false);
  };

  const getBlockPosition = (startTime: string) => {
    const [h, m] = startTime.split(':').map(Number);
    return ((h - 6) * 60 + m); // minutes from 6am
  };

  const getBlockHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm));
  };

  const COLORS: Record<string, string> = {
    indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    rose: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
  };

  return (
    <div className="page-padding max-w-7xl mx-auto h-full flex flex-col">
      {/* Header — responsive stacking */}
      <div className="flex flex-col gap-3 mb-5 md:mb-6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Calendar</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {calendarView === 'week'
                ? `${format(displayDays[0], 'MMM d')} — ${format(displayDays[displayDays.length - 1], 'MMM d, yyyy')}`
                : format(currentDate, 'EEEE, MMMM d, yyyy')
              }
            </p>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button onClick={goPrev} className="p-2 hover:bg-white/[0.06] active:bg-white/[0.08] rounded-lg transition" style={{ minWidth: '36px', minHeight: '36px' }}>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={goToday} className="btn-ghost text-xs px-2 md:px-3">Today</button>
            <button onClick={goNext} className="p-2 hover:bg-white/[0.06] active:bg-white/[0.08] rounded-lg transition" style={{ minWidth: '36px', minHeight: '36px' }}>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAddBlock(true)} className="btn-primary text-sm flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> Time Block
          </button>
          {/* Only show view toggle on desktop */}
          {!isMobile && (
            <div className="flex bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
              <button onClick={() => setCalendarView('day')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${calendarView === 'day' ? 'bg-white/[0.1] text-white' : 'text-slate-500'}`}>Day</button>
              <button onClick={() => setCalendarView('week')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${calendarView === 'week' ? 'bg-white/[0.1] text-white' : 'text-slate-500'}`}>Week</button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-0">
        {/* Day Headers */}
        <div className={`grid ${calendarView === 'week' ? 'grid-cols-8' : 'grid-cols-2'} border-b border-white/[0.06]`}>
          <div className="p-2 md:p-3 text-[10px] text-slate-600 font-medium border-r border-white/[0.04] flex items-center justify-center">
            <Clock className="w-3 h-3" />
          </div>
          {displayDays.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`p-2 md:p-3 text-center border-r border-white/[0.04] last:border-r-0 ${isToday ? 'bg-indigo-500/[0.08]' : ''}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-slate-600'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-base md:text-lg font-bold mt-0.5 ${isToday ? 'text-indigo-300' : 'text-slate-300'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className={`grid ${calendarView === 'week' ? 'grid-cols-8' : 'grid-cols-2'} relative`}>
            {/* Time Labels */}
            <div className="border-r border-white/[0.04]">
              {HOURS.map(hour => (
                <div key={hour} className="h-14 md:h-16 px-1.5 md:px-2 py-1 border-b border-white/[0.03] flex items-start justify-end">
                  <span className="text-[9px] md:text-[10px] text-slate-600 font-medium -mt-1">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {displayDays.map(day => {
              const dayBlocks = getBlocksForDay(day);
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, new Date());
              const hourHeight = isMobile ? 56 : 64; // h-14 = 56px, h-16 = 64px

              return (
                <div key={day.toISOString()} className={`relative border-r border-white/[0.04] last:border-r-0 ${isToday ? 'bg-indigo-500/[0.02]' : ''}`}>
                  {/* Hour lines */}
                  {HOURS.map(hour => (
                    <div key={hour} className="h-14 md:h-16 border-b border-white/[0.03]" />
                  ))}

                  {/* Time Blocks */}
                  {dayBlocks.map(block => {
                    const top = (getBlockPosition(block.startTime) / 60) * hourHeight;
                    const height = (getBlockHeight(block.startTime, block.endTime) / 60) * hourHeight;
                    const colorClass = COLORS[block.color] || COLORS.indigo;

                    return (
                      <div
                        key={block.id}
                        className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-lg border p-1 md:p-1.5 ${colorClass} z-10 overflow-hidden group cursor-pointer`}
                        style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] font-medium truncate">{block.title}</p>
                            <p className="text-[8px] md:text-[9px] opacity-60">{block.startTime} - {block.endTime}</p>
                          </div>
                          <button
                            onClick={() => deleteTimeBlock(block.id)}
                            className="touch-action-btn transition shrink-0 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tasks due this day */}
                  {dayTasks.map((task, i) => (
                    <div
                      key={task._id}
                      className="absolute left-0.5 right-0.5 md:left-1 md:right-1 rounded-lg border bg-rose-500/15 border-rose-500/25 text-rose-300 p-1 z-10"
                      style={{ top: `${(3 + i * 1.2) * hourHeight}px`, height: `${Math.min(40, hourHeight * 0.7)}px` }}
                    >
                      <p className="text-[9px] md:text-[10px] font-medium truncate">{task.title}</p>
                      <p className="text-[7px] md:text-[8px] opacity-60">{task.priority} · Due today</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Time Block Modal */}
      {showAddBlock && (
        <div className="modal-overlay" onClick={() => setShowAddBlock(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/[0.1] p-5 rounded-t-2xl md:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">New Time Block</h3>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Block title"
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
                className="input-base text-sm"
              />
              <input
                type="date"
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                className="input-base text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Start</label>
                  <input type="time" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} className="input-base text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">End</label>
                  <input type="time" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} className="input-base text-sm" />
                </div>
              </div>
              <button onClick={handleAddBlock} disabled={!newBlockTitle.trim()} className="w-full btn-primary text-sm">
                Add Block
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
