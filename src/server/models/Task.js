const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'done'],
      default: 'todo',
    },
    due_date: {
      type: String, // Stored as 'YYYY-MM-DD' string for frontend compatibility
      required: true,
      index: true,
    },
    scheduled_time: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    notes: {
      type: String,
      default: null,
    },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', null],
      default: null,
    },
    recurrence_end: {
      type: String, // 'YYYY-MM-DD' string
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common query patterns
taskSchema.index({ userId: 1, due_date: 1 });
taskSchema.index({ userId: 1, deletedAt: 1 });
taskSchema.index({ userId: 1, status: 1 });

// Transform output to match frontend expectations
taskSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Task', taskSchema);
