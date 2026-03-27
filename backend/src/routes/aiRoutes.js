import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// Simulated NLP Endpoint (Ramble-to-Task / Auto-Scheduling)
// In a real app, this would call OpenAI/Gemini API
router.post('/parse', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  
  // Simulated parsing logic
  // 'Meeting with Rahul tomorrow at 5pm every Friday'
  
  let title = text;
  let priority = 'P4';
  let energyLevel = 'shallow';
  
  if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('important')) {
    priority = 'P1';
    energyLevel = 'deep';
  }
  
  // Create mock parsed tasks
  const extractedTasks = [
    {
      title: title,
      priority,
      energyLevel,
      dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    }
  ];

  // If we wanted to split tasks: e.g. "I need to finish my assignment, call mom, and buy groceries"
  if (text.includes(',')) {
    const parts = text.split(',');
    return res.json({ tasks: parts.map(p => ({ title: p.trim(), priority: 'P2', energyLevel: 'shallow' })) });
  }
  
  res.json({ tasks: extractedTasks });
});

// Burnout Detection API
router.get('/burnout-status/:userId', async (req, res) => {
  try {
    const p1Tasks = await Task.countDocuments({
      assignedTo: req.params.userId,
      priority: 'P1',
      status: { $ne: 'done' }
    });
    
    // Threshold condition
    if (p1Tasks > 5) {
      return res.json({ status: 'warning', message: '⚠️ This looks overwhelming', count: p1Tasks });
    }
    
    res.json({ status: 'ok', count: p1Tasks });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

export default router;
