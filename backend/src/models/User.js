import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String },
  avatar: { type: String, default: '' },
  // Google OAuth / Drive
  googleId: { type: String },
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },
  driveConnected: { type: Boolean, default: false },
  lastBackup: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  // Preferences
  preferences: {
    darkMode: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    autoBackup: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
