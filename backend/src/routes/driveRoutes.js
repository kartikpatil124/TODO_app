import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import * as driveService from '../services/driveService.js';

const router = express.Router();

// GET /drive/status — Check Drive connection status
router.get('/status', auth, async (req, res) => {
  try {
    if (!driveService.isConfigured()) {
      return res.json({ configured: false, connected: false, lastBackup: null });
    }
    const user = await User.findById(req.user.id).select('driveConnected lastBackup');
    res.json({
      configured: true,
      connected: user.driveConnected || false,
      lastBackup: user.lastBackup || null,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /drive/connect — Get Google OAuth consent URL
router.get('/connect', auth, (req, res) => {
  try {
    if (!driveService.isConfigured()) {
      return res.status(400).json({ msg: 'Google Drive is not configured on this server' });
    }
    const url = driveService.getAuthUrl();
    // Append state with userId so we can identify user in callback
    const separator = url.includes('?') ? '&' : '?';
    const urlWithState = `${url}${separator}state=${req.user.id}`;
    res.json({ url: urlWithState });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /drive/callback — OAuth callback (redirected from Google)
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.status(400).send('No authorization code');

    const tokens = await driveService.getTokenFromCode(code);

    await User.findByIdAndUpdate(userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || undefined,
      driveConnected: true,
    });

    // Redirect to frontend profile page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?driveConnected=true`);
  } catch (err) {
    console.error('Drive callback error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?driveError=true`);
  }
});

// POST /drive/backup — Backup data to Google Drive
router.post('/backup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.driveConnected || !user.googleAccessToken) {
      return res.status(400).json({ msg: 'Google Drive not connected' });
    }

    // Gather all user data
    const [tasks, projects] = await Promise.all([
      Task.find({ assignedTo: req.user.id }),
      Project.find({ owner: req.user.id }),
    ]);

    const backupData = {
      tasks,
      projects,
      metadata: {
        lastBackup: new Date().toISOString(),
        version: '1.0',
        userId: req.user.id,
        taskCount: tasks.length,
        projectCount: projects.length,
      },
    };

    const result = await driveService.uploadBackup(
      user.googleAccessToken,
      user.googleRefreshToken,
      backupData
    );

    // Update last backup timestamp
    user.lastBackup = new Date();
    await user.save();

    res.json({
      msg: `Backup ${result.action} successfully`,
      lastBackup: user.lastBackup,
      stats: { tasks: tasks.length, projects: projects.length },
    });
  } catch (err) {
    console.error('Backup error:', err.message);
    if (err.code === 401 || err.message?.includes('invalid_grant')) {
      // Token expired — mark as disconnected
      await User.findByIdAndUpdate(req.user.id, { driveConnected: false, googleAccessToken: null });
      return res.status(401).json({ msg: 'Drive session expired. Please reconnect.' });
    }
    res.status(500).json({ msg: 'Backup failed' });
  }
});

// POST /drive/restore — Restore data from Google Drive
router.post('/restore', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.driveConnected || !user.googleAccessToken) {
      return res.status(400).json({ msg: 'Google Drive not connected' });
    }

    const backupData = await driveService.downloadBackup(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    if (!backupData) {
      return res.status(404).json({ msg: 'No backup found on Google Drive' });
    }

    // Restore strategy: clear existing data and replace
    await Promise.all([
      Task.deleteMany({ assignedTo: req.user.id }),
      Project.deleteMany({ owner: req.user.id }),
    ]);

    // Re-insert with correct user ownership
    if (backupData.tasks?.length) {
      const tasks = backupData.tasks.map(t => ({ ...t, _id: undefined, assignedTo: req.user.id }));
      await Task.insertMany(tasks);
    }
    if (backupData.projects?.length) {
      const projects = backupData.projects.map(p => ({ ...p, _id: undefined, owner: req.user.id }));
      await Project.insertMany(projects);
    }

    res.json({
      msg: 'Data restored successfully from backup',
      restored: {
        tasks: backupData.tasks?.length || 0,
        projects: backupData.projects?.length || 0,
      },
      backupTimestamp: backupData.metadata?.lastBackup,
    });
  } catch (err) {
    console.error('Restore error:', err.message);
    if (err.code === 401 || err.message?.includes('invalid_grant')) {
      await User.findByIdAndUpdate(req.user.id, { driveConnected: false, googleAccessToken: null });
      return res.status(401).json({ msg: 'Drive session expired. Please reconnect.' });
    }
    res.status(500).json({ msg: 'Restore failed' });
  }
});

// POST /drive/disconnect — Disconnect Google Drive
router.post('/disconnect', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleAccessToken: null,
      googleRefreshToken: null,
      driveConnected: false,
    });
    res.json({ msg: 'Google Drive disconnected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
