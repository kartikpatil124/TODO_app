import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import Task from './src/models/Task.js';
import Habit from './src/models/Habit.js';
import Note from './src/models/Note.js';
import TimeBlock from './src/models/TimeBlock.js';

import habitRoutes from './src/routes/habitRoutes.js';
import noteRoutes from './src/routes/noteRoutes.js';
import calendarRoutes from './src/routes/calendarRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

const TEST_SECRET = 'test_secret_for_modules_1234567890';
process.env.JWT_SECRET = TEST_SECRET;

const app = express();
app.use(express.json());
app.use('/api/habits', habitRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/user', userRoutes);

function request(server, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost');
    const options = {
      hostname: server.address().address === '::' ? '127.0.0.1' : server.address().address,
      port: server.address().port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- Starting Habits, Notes & Calendar Integration Tests ---');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Create two users
    const userA = await User.create({ email: 'userA@example.com', name: 'User A' });
    const userB = await User.create({ email: 'userB@example.com', name: 'User B' });

    const tokenA = jwt.sign({ user: { id: userA._id.toString() } }, TEST_SECRET);
    const tokenB = jwt.sign({ user: { id: userB._id.toString() } }, TEST_SECRET);

    const authA = { Authorization: `Bearer ${tokenA}` };
    const authB = { Authorization: `Bearer ${tokenB}` };

    // --- TEST HABITS ---
    console.log('Testing Habits API...');
    const createHabitRes = await request(server, 'POST', '/api/habits', authA, {
      title: 'Morning Jog',
      frequency: 'daily',
      icon: '🏃',
      color: '#10b981',
    });
    if (createHabitRes.status !== 201 || createHabitRes.body.title !== 'Morning Jog') {
      throw new Error(`Failed to create habit: ${JSON.stringify(createHabitRes.body)}`);
    }
    const habitId = createHabitRes.body._id;

    // Toggle habit for today
    const todayStr = new Date().toISOString().split('T')[0];
    const toggleRes = await request(server, 'POST', `/api/habits/${habitId}/toggle`, authA, {
      date: todayStr,
    });
    if (toggleRes.status !== 200 || !toggleRes.body.completedDates.includes(todayStr) || toggleRes.body.streak !== 1) {
      throw new Error(`Toggle habit failed: ${JSON.stringify(toggleRes.body)}`);
    }

    // Verify User B cannot access User A's habit
    const userBHabits = await request(server, 'GET', '/api/habits', authB);
    if (userBHabits.body.length !== 0) {
      throw new Error('User isolation failed: User B saw User A habit');
    }

    // --- TEST NOTES ---
    console.log('Testing Notes API...');
    const createNoteRes = await request(server, 'POST', '/api/notes', authA, {
      title: 'Meeting Notes',
      content: 'Discuss quarterly roadmap',
      tags: ['work', 'strategy'],
    });
    if (createNoteRes.status !== 201 || createNoteRes.body.title !== 'Meeting Notes') {
      throw new Error(`Failed to create note: ${JSON.stringify(createNoteRes.body)}`);
    }
    const noteId = createNoteRes.body._id;

    const updateNoteRes = await request(server, 'PUT', `/api/notes/${noteId}`, authA, {
      title: 'Updated Meeting Notes',
    });
    if (updateNoteRes.status !== 200 || updateNoteRes.body.title !== 'Updated Meeting Notes') {
      throw new Error(`Failed to update note: ${JSON.stringify(updateNoteRes.body)}`);
    }

    const userBNotes = await request(server, 'GET', '/api/notes', authB);
    if (userBNotes.body.length !== 0) {
      throw new Error('User isolation failed: User B saw User A note');
    }

    // --- TEST CALENDAR ---
    console.log('Testing Calendar API...');
    const createBlockRes = await request(server, 'POST', '/api/calendar', authA, {
      title: 'Focus Sprint',
      date: todayStr,
      startTime: '10:00',
      endTime: '11:30',
      color: 'indigo',
    });
    if (createBlockRes.status !== 201 || createBlockRes.body.title !== 'Focus Sprint') {
      throw new Error(`Failed to create timeblock: ${JSON.stringify(createBlockRes.body)}`);
    }

    const userBBlocks = await request(server, 'GET', '/api/calendar', authB);
    if (userBBlocks.body.length !== 0) {
      throw new Error('User isolation failed: User B saw User A calendar block');
    }

    // --- TEST CASCADE DELETION ---
    console.log('Testing Cascade Deletion...');
    await Task.create({ title: 'Task to be cascaded', userId: userA._id });

    const deleteAccountRes = await request(server, 'DELETE', '/api/user/delete', authA);
    if (deleteAccountRes.status !== 200) {
      throw new Error(`Failed to delete account: ${JSON.stringify(deleteAccountRes.body)}`);
    }

    const remainingTasks = await Task.countDocuments({ userId: userA._id });
    const remainingHabits = await Habit.countDocuments({ userId: userA._id });
    const remainingNotes = await Note.countDocuments({ userId: userA._id });
    const remainingBlocks = await TimeBlock.countDocuments({ userId: userA._id });

    if (remainingTasks !== 0 || remainingHabits !== 0 || remainingNotes !== 0 || remainingBlocks !== 0) {
      throw new Error(`Cascade deletion failed! Tasks: ${remainingTasks}, Habits: ${remainingHabits}, Notes: ${remainingNotes}, Blocks: ${remainingBlocks}`);
    }

    console.log('✅ ALL TESTS PASSED: Habits, Notes, Calendar, Isolation, and Cascade Deletion Verified Successfully!');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
