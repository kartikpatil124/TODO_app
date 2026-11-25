import express from 'express';
import mongoose from 'mongoose';
import Note from '../models/Note.js';
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

// GET /api/notes — Get all notes for user
router.get('/', auth, asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(notes);
}));

// POST /api/notes — Create new note
router.post('/', auth, asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ msg: 'Note title is required' });
  }

  const note = new Note({
    title: title.trim(),
    content: content || '',
    tags: Array.isArray(tags) ? tags : [],
    userId: req.user.id
  });

  await note.save();
  res.status(201).json(note);
}));

// PUT /api/notes/:id — Update note
router.put('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const allowed = ['title', 'content', 'tags'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  delete updates.userId;
  delete updates._id;

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );

  if (!note) return res.status(404).json({ msg: 'Note not found' });
  res.json(note);
}));

// DELETE /api/notes/:id — Delete note
router.delete('/:id', auth, validateObjectId('id'), asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!note) return res.status(404).json({ msg: 'Note not found' });
  res.json({ msg: 'Note deleted' });
}));

export default router;
