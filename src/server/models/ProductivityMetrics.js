const mongoose = require('mongoose');

const productivityMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    weeklyStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProductivityMetrics', productivityMetricsSchema);
