import mongoose from 'mongoose';

const timeBlockSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  startTime: { type: String, required: true }, // 'HH:mm'
  endTime: { type: String, required: true }, // 'HH:mm'
  color: { type: String, default: 'indigo' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

export default mongoose.model('TimeBlock', timeBlockSchema);
