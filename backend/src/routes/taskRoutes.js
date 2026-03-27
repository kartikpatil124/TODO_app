import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// Mock Auth Middleware
const auth = (req, res, next) => {
  req.user = { id: req.headers.userid || 'mock-user-id' }; // Simplified for MVP if no token passed, but in real use auth token
  next();
};

// Get all tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, status, energyLevel } = req.body;
    const newTask = new Task({
      title,
      description,
      priority,
      dueDate,
      status,
      energyLevel,
      assignedTo: req.user.id
    });
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

export default router;
