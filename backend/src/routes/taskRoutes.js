import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
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

// GET /api/tasks — Get all tasks for authenticated user
router.get('/', auth, asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(tasks);
}));

// POST /api/tasks — Create task
router.post('/', auth, asyncHandler(async (req, res) => {
  const { title, description, priority, dueDate, status, energyLevel, tags, subtasks, recurring, completed } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ msg: 'Task title is required' });
  }

  const newTask = new Task({
    title: title.trim(),
    description: description ? description.trim() : undefined,
    priority: priority || 'P4',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    status: status || 'todo',
    energyLevel: energyLevel || 'shallow',
    tags: Array.isArray(tags) ? tags : [],
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    recurring: recurring || 'none',
    completed: Boolean(completed),
    userId: req.user.id
  });

  const task = await newTask.save();
  res.status(201).json(task);
}));

// PUT /api/tasks/:id — Update task with strict whitelist
router.put('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const allowedFields = [
    'title', 'description', 'status', 'priority', 'energyLevel',
    'dueDate', 'tags', 'subtasks', 'recurring', 'completed'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'title' && typeof req.body.title === 'string') {
        updates.title = req.body.title.trim();
      } else if (field === 'dueDate') {
        updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  // Never allow changing userId or _id
  delete updates.userId;
  delete updates._id;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );

  if (!task) {
    return res.status(404).json({ msg: 'Task not found' });
  }

  res.json(task);
}));

// DELETE /api/tasks/:id — Delete task
router.delete('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) {
    return res.status(404).json({ msg: 'Task not found' });
  }
  res.json({ msg: 'Task removed' });
}));

export default router;
