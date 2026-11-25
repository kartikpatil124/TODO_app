import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { FRONTEND_URL } from './src/config/appUrls.js';

dotenv.config();

// S2: JWT_SECRET verification — Server MUST refuse to boot if missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const app = express();

// Security headers with Helmet
app.use(helmet());

// CORS restriction: Allow only FRONTEND_URL and local dev origins
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { msg: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { msg: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'healthy' : 'degraded',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
import authRoutes from './src/routes/authRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import driveRoutes from './src/routes/driveRoutes.js';
import habitRoutes from './src/routes/habitRoutes.js';
import noteRoutes from './src/routes/noteRoutes.js';
import calendarRoutes from './src/routes/calendarRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar', calendarRoutes);

// Global Error Handling Middleware — Returns JSON { msg }
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    msg: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5005;

async function connectDB() {
  const customUri = process.env.MONGO_URI;
  if (customUri) {
    try {
      await mongoose.connect(customUri);
      console.log('Connected to MongoDB via MONGO_URI');
      return;
    } catch (err) {
      console.error('Failed to connect to MONGO_URI:', err.message);
      process.exit(1);
    }
  }

  // Try local MongoDB first with short timeout
  const localUri = 'mongodb://127.0.0.1:27017/smart-productivity';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local MongoDB');
    return;
  } catch {
    console.log('Local MongoDB not running. Starting in-memory MongoDB...');
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Connect to MongoDB FIRST, then listen. Exit on failure.
async function startServer() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
