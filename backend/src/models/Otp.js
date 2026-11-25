import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  hashedPassword: {
    type: String
  },
  type: {
    type: String,
    enum: ['registration', 'login', 'reset'],
    default: 'registration'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Otp', otpSchema);

