import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  streak: { type: Number, default: 0 },
  completedDates: [{ type: String }],
  color: { type: String, default: 'indigo' },
  icon: { type: String, default: '🎯' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);
