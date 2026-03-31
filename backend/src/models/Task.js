import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P4' },
  energyLevel: { type: String, enum: ['deep', 'shallow'], default: 'shallow' },
  dueDate: { type: Date },
  tags: [{ type: String }],
  completed: { type: Boolean, default: false },
  userId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
