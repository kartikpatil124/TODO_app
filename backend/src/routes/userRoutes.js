import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import Note from '../models/Note.js';
import TimeBlock from '../models/TimeBlock.js';
import auth from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// GET /api/user/me — Get authenticated user profile
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -googleAccessToken -googleRefreshToken');
  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json(user);
}));

// PUT /api/user/update — Update profile (name, avatar, preferences) with strict whitelist
router.put('/update', auth, asyncHandler(async (req, res) => {
  const { name, avatar, preferences } = req.body;
  const updates = {};

  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim();
  }
  if (typeof avatar === 'string') {
    updates.avatar = avatar;
  }
  if (preferences && typeof preferences === 'object') {
    const allowedPrefKeys = ['darkMode', 'notifications', 'autoBackup'];
    const sanitizedPref = {};
    for (const key of allowedPrefKeys) {
      if (typeof preferences[key] === 'boolean') {
        sanitizedPref[key] = preferences[key];
      }
    }
    if (Object.keys(sanitizedPref).length > 0) {
      updates.preferences = sanitizedPref;
    }
  }

  // Strictly disallow any tampering with identity, auth, or tokens
  delete updates._id;
  delete updates.id;
  delete updates.email;
  delete updates.password;
  delete updates.googleId;
  delete updates.googleAccessToken;
  delete updates.googleRefreshToken;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  ).select('-password -googleAccessToken -googleRefreshToken');

  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json(user);
}));

// PUT /api/user/password — Change password (allows Google-only users to set initial password)
router.put('/password', auth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ msg: 'New password must be at least 8 characters long' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ msg: 'User not found' });

  // If user already has a password set, require current password and verify
  if (user.password) {
    if (!currentPassword) {
      return res.status(400).json({ msg: 'Current password is required' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({ msg: 'Password updated successfully' });
}));

// DELETE /api/user/delete — Cascade delete account and user data
router.delete('/delete', auth, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [taskResult, habitResult, noteResult, calendarResult] = await Promise.all([
    Task.deleteMany({ userId }),
    Habit.deleteMany({ userId }),
    Note.deleteMany({ userId }),
    TimeBlock.deleteMany({ userId })
  ]);

  await User.findByIdAndDelete(userId);

  res.json({
    msg: 'Account and all associated data deleted permanently',
    deleted: {
      tasks: taskResult.deletedCount,
      habits: habitResult.deletedCount,
      notes: noteResult.deletedCount,
      timeBlocks: calendarResult.deletedCount
    }
  });
}));

export default router;
