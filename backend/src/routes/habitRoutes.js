import express from 'express';
import mongoose from 'mongoose';
import Habit from '../models/Habit.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: `Invalid ID: ${id}` });
    }
    next();
  };
}

// Calculate streak based on consecutive completed days ending today or yesterday
function calculateStreak(completedDates) {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0;
  const datesSet = new Set(completedDates);
  
  const today = new Date();
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYMD(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // If today isn't done yet, check if yesterday was done to continue the streak
  if (!datesSet.has(todayStr)) {
    if (!datesSet.has(yesterdayStr)) {
      return 0;
    }
    checkDate = yesterday;
  }

  while (true) {
    const checkStr = formatYMD(checkDate);
    if (datesSet.has(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

// GET /api/habits — Get all habits for authenticated user
router.get('/', auth, asyncHandler(async (req, res) => {
  const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(habits);
}));

// POST /api/habits — Create new habit
router.post('/', auth, asyncHandler(async (req, res) => {
  const { title, frequency, color, icon } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ msg: 'Habit title is required' });
  }

  const habit = new Habit({
    title: title.trim(),
    frequency: frequency === 'weekly' ? 'weekly' : 'daily',
    color: color || 'indigo',
    icon: icon || '🎯',
    streak: 0,
    completedDates: [],
    userId: req.user.id
  });

  await habit.save();
  res.status(201).json(habit);
}));

// PUT /api/habits/:id — Update habit details
router.put('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const allowed = ['title', 'frequency', 'color', 'icon'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  delete updates.userId;
  delete updates._id;

  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );

  if (!habit) return res.status(404).json({ msg: 'Habit not found' });
  res.json(habit);
}));

// POST /api/habits/:id/toggle — Toggle completion date and recalculate streak
router.post('/:id/toggle', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ msg: 'Valid date is required' });
  }

  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ msg: 'Habit not found' });

  const dateIndex = habit.completedDates.indexOf(date);
  if (dateIndex > -1) {
    habit.completedDates.splice(dateIndex, 1);
  } else {
    habit.completedDates.push(date);
  }

  habit.streak = calculateStreak(habit.completedDates);
  await habit.save();

  res.json(habit);
}));

// DELETE /api/habits/:id — Delete habit
router.delete('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ msg: 'Habit not found' });
  res.json({ msg: 'Habit deleted' });
}));

export default router;
