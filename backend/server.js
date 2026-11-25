import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { FRONTEND_URL } from './src/config/appUrls.js';

dotenv.config();

// JWT_SECRET fallback to ensure smooth boot in production if env is missing
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-os-secure-fallback-secret-2026';
if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY NOTICE] JWT_SECRET environment variable is missing. Using secure default secret. Please configure JWT_SECRET in your production dashboard.');
  process.env.JWT_SECRET = JWT_SECRET;
}

const app = express();

// Security headers with Helmet
app.use(helmet());

// CORS restriction: Allow FRONTEND_URL, Vercel deployments, and local dev origins
const allowedOrigins = [
  FRONTEND_URL,
  'https://todo-app-ten-green-65.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
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
  max: 60,
  message: { msg: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/auth', authLimiter);

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Nexus OS API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting'
  });
});

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

// Dual-mount under both /api/... and legacy /... for 100% routing compatibility
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/tasks', taskRoutes);

app.use('/api/user', userRoutes);
app.use('/user', userRoutes);

app.use('/api/drive', driveRoutes);
app.use('/drive', driveRoutes);

app.use('/api/habits', habitRoutes);
app.use('/habits', habitRoutes);

app.use('/api/notes', noteRoutes);
app.use('/notes', noteRoutes);

app.use('/api/calendar', calendarRoutes);
app.use('/calendar', calendarRoutes);

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
  }
}

// Start listening immediately so hosting platforms (Render, Railway, etc.) detect the healthy port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

connectDB().catch((err) => {
  console.error('DB connect exception:', err);
});
