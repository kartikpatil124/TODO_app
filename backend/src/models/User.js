import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  chronotype: { type: String, enum: ['Lion', 'Bear', 'Wolf', 'Dolphin'], default: 'Bear' },
  peakHours: {
    start: { type: String, default: '10:00' },
    end: { type: String, default: '14:00' }
  },
  // Google OAuth / Drive
  googleId: { type: String },
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },
  driveConnected: { type: Boolean, default: false },
  lastBackup: { type: Date },
  // Preferences
  preferences: {
    darkMode: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    autoBackup: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
