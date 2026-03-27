import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generatePayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  xp: user.xp,
  level: user.level,
  streak: user.streak,
  driveConnected: user.driveConnected,
  preferences: user.preferences
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Please provide all fields' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: generatePayload(user) });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    if (!user.password) {
      return res.status(400).json({ msg: 'This account uses Google Sign-In. Please click the Google button.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: generatePayload(user) });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token, userInfo } = req.body;
    
    let email, name, picture, sub;

    // Fast verification using Google's userinfo endpoint data sent by frontend
    if (userInfo && userInfo.email) {
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
      sub = userInfo.sub;
    } else {
      // Fallback: Verify ID token if that's what was sent
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      sub = payload.sub;
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user for Google Sign-in
      user = new User({ name, email, avatar: picture, googleId: sub });
      await user.save();
    } else if (!user.googleId) {
      // Link existing email to Google
      user.googleId = sub;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, jwtToken) => {
      if (err) throw err;
      res.json({ token: jwtToken, user: generatePayload(user) });
    });
  } catch(err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ msg: 'Google Auth Failed' });
  }
});

export default router;
