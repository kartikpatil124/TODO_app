import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P4' },
  energyLevel: { type: String, enum: ['deep', 'shallow'], default: 'shallow' },
  dueDate: { type: Date },
  tags: [{ type: String, trim: true }],
  subtasks: [{
    id: { type: String },
    title: { type: String, trim: true },
    completed: { type: Boolean, default: false }
  }],
  recurring: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
