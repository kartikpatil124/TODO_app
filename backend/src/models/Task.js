import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P4' },
  dueDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  energyLevel: { type: String, enum: ['deep', 'shallow'], default: 'shallow' },
  tags: [{ type: String }],
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  commitmentProofRequired: { type: Boolean, default: false } // For Commitment Mode
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
