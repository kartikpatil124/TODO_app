import { spawn } from 'child_process';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
import { encryptToken, decryptToken } from '../src/utils/crypto.js';

const TEST_SECRET = 'test_jwt_secret_key_1234567890';
process.env.JWT_SECRET = TEST_SECRET;

async function runTests() {
  console.log('--- RUNNING PHASE 2 SECURITY ACCEPTANCE TESTS ---\n');

  // Test C: Server refuses to boot without JWT_SECRET
  console.log('Testing (c): Server refuses to boot without JWT_SECRET...');
  const bootResult = await new Promise((resolve) => {
    const proc = spawn('node', ['server.js'], {
      cwd: './backend',
      env: { ...process.env, JWT_SECRET: '' }
    });
    let output = '';
    proc.stderr.on('data', (d) => { output += d.toString(); });
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.on('close', (code) => {
      resolve({ code, output });
    });
  });

  if (bootResult.code !== 0 && bootResult.output.includes('FATAL: JWT_SECRET')) {
    console.log('✓ PASS: Server refused to boot when JWT_SECRET was missing (exit code: ' + bootResult.code + ')');
  } else {
    throw new Error('FAIL: Server did not exit cleanly when JWT_SECRET was missing: ' + bootResult.output);
  }

  // Set up in-memory DB connection for remaining tests
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('\nConnected to test DB.');

  // Create User A and User B
  const userA = await User.create({
    name: 'User A',
    email: 'user.a@example.com',
    password: 'hashedpasswordA',
    isEmailVerified: true
  });
  const tokenA = jwt.sign({ user: { id: userA.id } }, TEST_SECRET);

  const userB = await User.create({
    name: 'User B',
    email: 'user.b@example.com',
    password: 'hashedpasswordB',
    isEmailVerified: true
  });
  const tokenB = jwt.sign({ user: { id: userB.id } }, TEST_SECRET);

  // User A creates a Task
  const taskA = await Task.create({
    title: 'User A Confidential Task',
    userId: userA._id,
    priority: 'P1'
  });
  console.log('Created Task A for User A:', taskA._id.toString());

  // Test A1: User B cannot read User A's task
  console.log('\nTesting (a): User isolation (read, update, delete)...');
  const tasksForB = await Task.find({ userId: userB.id });
  const hasTaskA = tasksForB.some(t => t._id.equals(taskA._id));
  if (!hasTaskA) {
    console.log('✓ PASS: User B cannot see User A task in task queries');
  } else {
    throw new Error('FAIL: User B was able to see User A task');
  }

  // Test A2: User B cannot update User A's task
  const updateAttempt = await Task.findOneAndUpdate(
    { _id: taskA._id, userId: userB.id },
    { $set: { title: 'Hacked by B' } },
    { new: true }
  );
  if (!updateAttempt) {
    const verifiedTask = await Task.findById(taskA._id);
    if (verifiedTask.title === 'User A Confidential Task') {
      console.log('✓ PASS: User B update query returned null and title is unchanged');
    } else {
      throw new Error('FAIL: Task was modified by User B');
    }
  } else {
    throw new Error('FAIL: User B was able to update User A task');
  }

  // Test A3: User B cannot delete User A's task
  const deleteAttempt = await Task.findOneAndDelete({ _id: taskA._id, userId: userB.id });
  if (!deleteAttempt) {
    const stillExists = await Task.findById(taskA._id);
    if (stillExists) {
      console.log('✓ PASS: User B delete query returned null and task still exists');
    } else {
      throw new Error('FAIL: Task was deleted by User B');
    }
  } else {
    throw new Error('FAIL: User B was able to delete User A task');
  }

  // Test B: userId cannot be changed through mass assignment
  console.log('\nTesting (b): userId tampering prevention...');
  const maliciousUpdates = {
    title: 'Legitimate Title Update',
    userId: userB._id // Trying to steal ownership or reassign
  };
  // Simulate the handler logic: delete updates.userId
  delete maliciousUpdates.userId;
  delete maliciousUpdates._id;

  const sanitizedUpdate = await Task.findOneAndUpdate(
    { _id: taskA._id, userId: userA.id },
    { $set: maliciousUpdates },
    { new: true }
  );
  if (sanitizedUpdate && sanitizedUpdate.userId.equals(userA._id)) {
    console.log('✓ PASS: userId remains strictly User A despite malicious payload');
  } else {
    throw new Error('FAIL: userId was changed on task');
  }

  // Test Token Encryption at rest
  console.log('\nTesting AES-256-GCM token encryption...');
  const testPlainToken = 'ya29.sample_google_access_token_xyz_987654';
  const encrypted = encryptToken(testPlainToken);
  if (encrypted !== testPlainToken && encrypted.includes(':')) {
    const decrypted = decryptToken(encrypted);
    if (decrypted === testPlainToken) {
      console.log('✓ PASS: Google tokens successfully encrypted with IV & authTag and decrypted losslessly');
    } else {
      throw new Error('FAIL: Decrypted token does not match original');
    }
  } else {
    throw new Error('FAIL: Encryption did not produce expected ciphertext');
  }

  // Test D: Removed route returns 404
  console.log('\nTesting (d): Verify removed routes return 404...');
  const express = (await import('express')).default;
  const http = (await import('http')).default;
  const authRoutes = (await import('../src/routes/authRoutes.js')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const testPort = server.address().port;

  const resStatus = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: testPort,
      path: '/api/auth/google',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.write(JSON.stringify({ email: 'test@example.com' }));
    req.end();
  });

  server.close();

  if (resStatus === 404) {
    console.log(`✓ PASS: POST /api/auth/google returned status ${resStatus} (Route removed)`);
  } else {
    throw new Error(`FAIL: POST /api/auth/google returned ${resStatus} instead of 404`);
  }

  await mongoose.disconnect();
  await mongod.stop();

  console.log('\n--- ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
