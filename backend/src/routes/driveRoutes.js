import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import * as driveService from '../services/driveService.js';
import { FRONTEND_URL } from '../config/appUrls.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Helper to persist refreshed Google tokens
function createTokenRefreshHandler(userId) {
  return async (newTokens) => {
    try {
      const updates = {};
      if (newTokens.access_token) updates.googleAccessToken = encryptToken(newTokens.access_token);
      if (newTokens.refresh_token) updates.googleRefreshToken = encryptToken(newTokens.refresh_token);
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(userId, updates);
      }
    } catch (err) {
      console.error('Failed to persist refreshed Drive tokens:', err);
    }
  };
}

// GET /api/drive/status — Check Drive connection status
router.get('/status', auth, asyncHandler(async (req, res) => {
  if (!driveService.isConfigured()) {
    return res.json({ configured: false, connected: false, lastBackup: null });
  }
  const user = await User.findById(req.user.id).select('driveConnected lastBackup');
  res.json({
    configured: true,
    connected: Boolean(user?.driveConnected),
    lastBackup: user?.lastBackup || null,
  });
}));

// GET /api/drive/connect — Get Google OAuth consent URL with signed state JWT
router.get('/connect', auth, (req, res) => {
  if (!driveService.isConfigured()) {
    return res.status(400).json({ msg: 'Google Drive is not configured on this server' });
  }
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ msg: 'JWT_SECRET is missing' });
  }

  // Sign state with user id and a random nonce (10 min expiry)
  const stateToken = jwt.sign(
    { userId: req.user.id, nonce: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  const url = driveService.getAuthUrl();
  const separator = url.includes('?') ? '&' : '?';
  const urlWithState = `${url}${separator}state=${encodeURIComponent(stateToken)}`;
  res.json({ url: urlWithState });
});

// GET /api/drive/callback — OAuth callback (verifies state JWT, encrypts tokens)
router.get('/callback', asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/profile?driveError=missing_parameters`);
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  let decoded;
  try {
    decoded = jwt.verify(state, JWT_SECRET);
  } catch (err) {
    console.error('Invalid Drive OAuth state token:', err.message);
    return res.redirect(`${FRONTEND_URL}/profile?driveError=invalid_state`);
  }

  const userId = decoded.userId;
  const tokens = await driveService.getTokenFromCode(code);

  const updateFields = {
    driveConnected: true,
  };
  if (tokens.access_token) {
    updateFields.googleAccessToken = encryptToken(tokens.access_token);
  }
  if (tokens.refresh_token) {
    updateFields.googleRefreshToken = encryptToken(tokens.refresh_token);
  }

  await User.findByIdAndUpdate(userId, updateFields);
  res.redirect(`${FRONTEND_URL}/profile?drive=connected`);
}));

// POST /api/drive/backup — Backup data to Google Drive
router.post('/backup', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.driveConnected || !user.googleAccessToken) {
    return res.status(400).json({ msg: 'Google Drive not connected' });
  }

  const accessToken = decryptToken(user.googleAccessToken);
  const refreshToken = decryptToken(user.googleRefreshToken);

  const tasks = await Task.find({ userId: req.user.id });

  const backupData = {
    tasks,
    metadata: {
      lastBackup: new Date().toISOString(),
      version: '1.0',
      userId: req.user.id,
      taskCount: tasks.length,
    },
  };

  const onTokens = createTokenRefreshHandler(req.user.id);
  const result = await driveService.uploadBackup(accessToken, refreshToken, backupData, onTokens);

  user.lastBackup = new Date();
  await user.save();

  res.json({
    msg: `Backup ${result.action} successfully`,
    lastBackup: user.lastBackup,
    stats: { tasks: tasks.length },
  });
}));

// POST /api/drive/restore — Restore data from Google Drive (validated schema + transaction)
router.post('/restore', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.driveConnected || !user.googleAccessToken) {
    return res.status(400).json({ msg: 'Google Drive not connected' });
  }

  const accessToken = decryptToken(user.googleAccessToken);
  const refreshToken = decryptToken(user.googleRefreshToken);
  const onTokens = createTokenRefreshHandler(req.user.id);

  const backupData = await driveService.downloadBackup(accessToken, refreshToken, onTokens);
  if (!backupData || typeof backupData !== 'object' || !Array.isArray(backupData.tasks)) {
    return res.status(400).json({ msg: 'No valid backup found on Google Drive' });
  }

  // Schema validation before modifying any existing data
  for (const t of backupData.tasks) {
    if (!t || typeof t.title !== 'string' || !t.title.trim()) {
      return res.status(400).json({ msg: 'Backup contains invalid task records. Restore aborted.' });
    }
  }

  const restoredTasks = backupData.tasks.map((task) => ({
    title: task.title.trim(),
    description: task.description,
    status: task.status || 'todo',
    priority: task.priority || 'P4',
    energyLevel: task.energyLevel || 'shallow',
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tags: Array.isArray(task.tags) ? task.tags : [],
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    recurring: task.recurring || 'none',
    completed: Boolean(task.completed),
    userId: req.user.id,
  }));

  // Perform replacement safely
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Task.deleteMany({ userId: req.user.id }, { session });
        if (restoredTasks.length > 0) {
          await Task.insertMany(restoredTasks, { session });
        }
      });
    } finally {
      await session.endSession();
    }
  } catch (err) {
    // If running in an environment without replica sets (e.g. standalone test server), fallback to standard sequential
    if (err.message && err.message.includes('Transactions are not supported')) {
      await Task.deleteMany({ userId: req.user.id });
      if (restoredTasks.length > 0) {
        await Task.insertMany(restoredTasks);
      }
    } else {
      throw err;
    }
  }

  res.json({
    msg: 'Data restored successfully from Google Drive',
    stats: { tasks: restoredTasks.length },
  });
}));

// POST /api/drive/disconnect — Disconnect Google Drive
router.post('/disconnect', auth, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    googleAccessToken: null,
    googleRefreshToken: null,
    driveConnected: false,
    lastBackup: null,
  });
  res.json({ msg: 'Google Drive disconnected successfully' });
}));

export default router;
