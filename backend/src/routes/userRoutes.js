import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /user/me — Get authenticated user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -googleAccessToken -googleRefreshToken');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /user/update — Update profile (name, avatar, preferences)
router.put('/update', auth, async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (preferences) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select('-password -googleAccessToken -googleRefreshToken');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /user/password — Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
    } else {
      // User registered with Google and has no password yet
      if (currentPassword !== '') {
        return res.status(400).json({ msg: 'Account created with Google. Leave current password empty to set a new one.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /user/delete — Cascade delete account
router.delete('/delete', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Cascade delete all user data
    const [taskResult, projectResult] = await Promise.all([
      Task.deleteMany({ userId }),
      Project.deleteMany({ owner: userId }),
    ]);

    // Delete user
    await User.findByIdAndDelete(userId);

    console.log(`Account deleted: userId=${userId}, tasks=${taskResult.deletedCount}, projects=${projectResult.deletedCount}`);

    res.json({
      msg: 'Account and all associated data deleted permanently',
      deleted: {
        tasks: taskResult.deletedCount,
        projects: projectResult.deletedCount,
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
