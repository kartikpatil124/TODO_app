import express from 'express';
import mongoose from 'mongoose';
import TimeBlock from '../models/TimeBlock.js';
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

// GET /api/calendar — Get all time blocks for user
router.get('/', auth, asyncHandler(async (req, res) => {
  const blocks = await TimeBlock.find({ userId: req.user.id }).sort({ date: 1, startTime: 1 });
  res.json(blocks);
}));

// POST /api/calendar — Create new time block
router.post('/', auth, asyncHandler(async (req, res) => {
  const { title, date, startTime, endTime, color, taskId } = req.body;
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ msg: 'Title, date, startTime, and endTime are required' });
  }

  const block = new TimeBlock({
    title: title.trim(),
    date,
    startTime,
    endTime,
    color: color || 'indigo',
    taskId: taskId && mongoose.Types.ObjectId.isValid(taskId) ? taskId : undefined,
    userId: req.user.id
  });

  await block.save();
  res.status(201).json(block);
}));

// PUT /api/calendar/:id — Update time block
router.put('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const allowed = ['title', 'date', 'startTime', 'endTime', 'color', 'taskId'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  delete updates.userId;
  delete updates._id;

  const block = await TimeBlock.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );

  if (!block) return res.status(404).json({ msg: 'Time block not found' });
  res.json(block);
}));

// DELETE /api/calendar/:id — Delete time block
router.delete('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const block = await TimeBlock.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!block) return res.status(404).json({ msg: 'Time block not found' });
  res.json({ msg: 'Time block deleted' });
}));

export default router;
