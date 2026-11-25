import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { FRONTEND_URL, GOOGLE_AUTH_CALLBACK_URL } from '../config/appUrls.js';
import { sendOtpEmail, isEmailConfigured } from '../services/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const authCodes = new Map();

// Periodic cleanup of expired codes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes.entries()) {
    if (data.expiresAt < now) authCodes.delete(code);
  }
}, 30000);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || 'dummy_id',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
  GOOGLE_AUTH_CALLBACK_URL
);

const generatePayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  driveConnected: Boolean(user.driveConnected),
  preferences: user.preferences
});

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return secret;
}

// Step 1: Send OTP for Email Verification (Sign up)
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ msg: 'Please provide a valid email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.password) {
    return res.status(400).json({ msg: 'An account with this email already exists. Please sign in instead.' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ msg: 'Name is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters long' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Pre-hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Save pending OTP
  await Otp.deleteMany({ email: normalizedEmail });
  await Otp.create({
    email: normalizedEmail,
    otp,
    name: name.trim(),
    hashedPassword,
    type: 'registration',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });

  const emailResult = await sendOtpEmail({
    to: normalizedEmail,
    name: name.trim(),
    otp
  });

  if (!emailResult.delivered && !isEmailConfigured()) {
    return res.json({
      success: true,
      msg: 'Verification code generated! (Real email delivery requires SMTP_USER & SMTP_PASS configured in your Render dashboard).',
      devCode: otp
    });
  }

  if (!emailResult.delivered) {
    return res.status(500).json({
      msg: 'Failed to deliver email to ' + normalizedEmail + '. Please verify your SMTP settings in backend/.env.'
    });
  }

  res.json({
    success: true,
    msg: 'Verification code sent to your email address. Please check your inbox.'
  });
}));

// Step 2: Verify OTP and finalize registration
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ msg: 'Email and verification code are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const pendingRecord = await Otp.findOne({ email: normalizedEmail, type: 'registration' });

  if (!pendingRecord) {
    return res.status(400).json({ msg: 'No pending registration found for this email. Please sign up again.' });
  }

  if (new Date() > pendingRecord.expiresAt) {
    await Otp.deleteOne({ _id: pendingRecord._id });
    return res.status(400).json({ msg: 'Verification code has expired. Please request a new code.' });
  }

  if (pendingRecord.otp !== otp.toString().trim()) {
    return res.status(400).json({ msg: 'Invalid verification code. Please check your email and try again.' });
  }

  // Find existing account (e.g. from Google login) or create fresh user
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    if (pendingRecord.name && !user.name) user.name = pendingRecord.name;
    user.password = pendingRecord.hashedPassword;
    user.isEmailVerified = true;
    await user.save();
  } else {
    user = new User({
      name: pendingRecord.name,
      email: normalizedEmail,
      password: pendingRecord.hashedPassword,
      isEmailVerified: true
    });
    await user.save();
  }

  // Cleanup OTP
  await Otp.deleteOne({ _id: pendingRecord._id });

  // Issue JWT token synchronously
  const jwtSecret = getJwtSecret();
  const token = jwt.sign({ user: { id: user.id } }, jwtSecret, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: generatePayload(user)
  });
}));

// Direct Registration (fallback if used directly)
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please provide all fields' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (password.length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters long' });
  }

  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    return res.status(400).json({ msg: 'User already exists' });
  }

  user = new User({ name: name.trim(), email: normalizedEmail, password, isEmailVerified: false });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  await user.save();

  const jwtSecret = getJwtSecret();
  const token = jwt.sign({ user: { id: user.id } }, jwtSecret, { expiresIn: '7d' });

  res.json({ token, user: generatePayload(user) });
}));

// Standard Email & Password Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide both email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(400).json({ msg: 'Invalid email or password' });
  }

  if (!user.password) {
    return res.status(400).json({ msg: 'This account was created with Google Sign-In and has no password yet. Please sign in with Google, or sign up to set your password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid email or password' });
  }

  const jwtSecret = getJwtSecret();
  const token = jwt.sign({ user: { id: user.id } }, jwtSecret, { expiresIn: '7d' });

  res.json({ token, user: generatePayload(user) });
}));

// Google OAuth redirect
router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
    prompt: 'consent'
  });
  res.redirect(url);
});

// Google OAuth Callback (Validates ID token, requires email_verified === true)
router.get('/google/callback', asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }

  const { code } = req.query;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
  }

  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email_verified) {
    return res.redirect(`${FRONTEND_URL}/login?error=email_not_verified`);
  }

  const email = payload.email.toLowerCase().trim();
  const name = payload.name;
  const picture = payload.picture;
  const sub = payload.sub;

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      name,
      email,
      avatar: picture,
      googleId: sub,
      isEmailVerified: true
    });
    await user.save();
  } else {
    // Only link to existing account when email is verified
    if (!user.googleId) {
      user.googleId = sub;
    }
    user.avatar = user.avatar || picture;
    user.isEmailVerified = true;
    await user.save();
  }

  const jwtSecret = getJwtSecret();
  const jwtToken = jwt.sign({ user: { id: user.id } }, jwtSecret, { expiresIn: '7d' });

  // Issue single-use one-time code (60s expiry)
  const oneTimeCode = crypto.randomUUID();
  authCodes.set(oneTimeCode, {
    token: jwtToken,
    user: generatePayload(user),
    expiresAt: Date.now() + 60000
  });

  res.redirect(`${FRONTEND_URL}/auth/callback?code=${oneTimeCode}`);
}));

// POST /api/auth/exchange-code — Exchange one-time Google OAuth code for JWT token
router.post('/exchange-code', (req, res) => {
  const { code } = req.body;
  if (!code || !authCodes.has(code)) {
    return res.status(400).json({ msg: 'Invalid or expired authentication code' });
  }

  const data = authCodes.get(code);
  authCodes.delete(code); // Single use

  if (data.expiresAt < Date.now()) {
    return res.status(400).json({ msg: 'Authentication code expired. Please sign in again.' });
  }

  res.json({ token: data.token, user: data.user });
});

export default router;
